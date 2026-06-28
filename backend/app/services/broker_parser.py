import io
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.constants.lot_sizes import get_lot_size

class BrokerParser:
    @staticmethod
    def parse_xlsx_to_rows(file_bytes: bytes) -> List[Dict[str, str]]:
        file_like = io.BytesIO(file_bytes)
        
        with zipfile.ZipFile(file_like, 'r') as zip_ref:
            namelist = zip_ref.namelist()
            
            # Load shared strings
            shared_strings = []
            if 'xl/sharedStrings.xml' in namelist:
                with zip_ref.open('xl/sharedStrings.xml') as f:
                    tree = ET.parse(f)
                    root = tree.getroot()
                    ns_uri = root.tag.split('}')[0].strip('{') if '}' in root.tag else ''
                    ns = {'ns': ns_uri} if ns_uri else {}
                    
                    si_query = './/ns:si' if ns_uri else './/si'
                    t_query = 'ns:t' if ns_uri else 't'
                    
                    for si in root.findall(si_query, ns):
                        t = si.find(t_query, ns)
                        if t is not None:
                            shared_strings.append(t.text or "")
                        else:
                            shared_strings.append("")
                            
            # Read sheet1
            if 'xl/worksheets/sheet1.xml' in namelist:
                with zip_ref.open('xl/worksheets/sheet1.xml') as f:
                    tree = ET.parse(f)
                    root = tree.getroot()
                    ns_uri = root.tag.split('}')[0].strip('{') if '}' in root.tag else ''
                    ns = {'ns': ns_uri} if ns_uri else {}
                    
                    rows = []
                    row_query = './/ns:row' if ns_uri else './/row'
                    c_query = 'ns:c' if ns_uri else 'c'
                    v_query = 'ns:v' if ns_uri else 'v'
                    
                    for row in root.findall(row_query, ns):
                        row_data = {}
                        for c in row.findall(c_query, ns):
                            ref = c.get('r')
                            if not ref:
                                continue
                            col = "".join(filter(str.isalpha, ref))
                            val_el = c.find(v_query, ns)
                            val = ""
                            if val_el is not None:
                                val = val_el.text or ""
                                if c.get('t') == 's' and val:
                                    try:
                                        val = shared_strings[int(val)]
                                    except (ValueError, IndexError):
                                        pass
                            row_data[col] = val
                        rows.append(row_data)
                    return rows
        return []

    @staticmethod
    def parse_groww_date(date_str: str) -> datetime:
        """
        Parses date string format from Groww statement (e.g. '16 Jun 2026') into datetime.
        """
        try:
            return datetime.strptime(date_str.strip(), "%d %b %Y")
        except ValueError:
            try:
                # fallback formats
                return datetime.strptime(date_str.strip(), "%Y-%m-%d")
            except ValueError:
                return datetime.utcnow()

    @staticmethod
    def parse_groww_fno(rows: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Parse trades from Groww F&O report list of row dicts.
        We scan for sections: 'Futures' and 'Options'.
        """
        trades = []
        current_section = None # 'FUTURES' or 'OPTIONS'
        header_map = {} # maps column letters to header labels: {'A': 'Scrip Name', ...}
        in_trades_block = False

        for row in rows:
            # Check for section markers
            row_vals = [val.strip() for val in row.values() if val]
            if not row_vals:
                in_trades_block = False
                continue
                
            first_val = row_vals[0]
            if "Futures" in first_val and len(row_vals) == 1:
                current_section = "FUTURES"
                in_trades_block = False
                continue
            elif "Options" in first_val and len(row_vals) == 1:
                current_section = "OPTIONS"
                in_trades_block = False
                continue
            elif "Disclaimer" in first_val:
                break
                
            # If we hit the header row
            if "Scrip Name" in row_vals and "Quantity" in row_vals:
                # Establish header map
                header_map = {col: val.strip() for col, val in row.items()}
                in_trades_block = True
                continue
                
            if in_trades_block and current_section:
                # Map columns by name
                scrip_name = ""
                qty_str = "0"
                buy_date_str = ""
                buy_price_str = "0"
                sell_date_str = ""
                sell_price_str = "0"
                realized_pnl_str = "0"
                
                for col, val in row.items():
                    header = header_map.get(col, "")
                    if header == "Scrip Name":
                        scrip_name = val
                    elif header == "Quantity":
                        qty_str = val
                    elif header == "Buy Date":
                        buy_date_str = val
                    elif header == "Buy Price":
                        buy_price_str = val
                    elif header == "Sell Date":
                        sell_date_str = val
                    elif header == "Sell Price":
                        sell_price_str = val
                    elif header == "Realized P&L":
                        realized_pnl_str = val
                        
                if not scrip_name or qty_str == "" or realized_pnl_str == "":
                    continue
                    
                try:
                    raw_qty = float(qty_str)
                    buy_price = float(buy_price_str)
                    sell_price = float(sell_price_str)
                    realized_pnl = float(realized_pnl_str)
                except ValueError:
                    continue # Skip invalid row
                    
                # Determine Option type or direction
                direction = "BUY" # Default for option buyer
                strike_price = None
                
                scrip_upper = scrip_name.upper()
                
                # Normalize symbol to match manual entry keys
                symbol = scrip_name
                s_clean = scrip_upper.replace(" ", "").replace("_", "").replace("-", "")
                if "BANKNIFTY" in s_clean:
                    symbol = "BANKNIFTY"
                elif "FINNIFTY" in s_clean:
                    symbol = "FINNIFTY"
                elif "MIDCPNIFTY" in s_clean or "MIDCAP" in s_clean:
                    symbol = "MIDCPNIFTY"
                elif "NIFTY" in s_clean:
                    symbol = "NIFTY"
                elif "SENSEX" in s_clean:
                    symbol = "SENSEX"
                else:
                    words = scrip_name.strip().split()
                    if words:
                        symbol = words[0].upper()
                
                # Extract strike price and option type for Options
                if current_section == "OPTIONS":
                    if "CALL" in scrip_upper or scrip_upper.endswith("CE") or " C " in scrip_upper or "CALL" in scrip_upper:
                        direction = "CALL"
                    elif "PUT" in scrip_upper or scrip_upper.endswith("PE") or " P " in scrip_upper or "PUT" in scrip_upper:
                        direction = "PUT"
                        
                    # Extract strike price if possible (find digits before Call/Put)
                    words = scrip_upper.split()
                    for idx, w in enumerate(words):
                        if w in ["CALL", "PUT", "CE", "PE", "C", "P"]:
                            if idx > 0:
                                try:
                                    strike_price = float(words[idx-1])
                                except ValueError:
                                    pass
                else:
                    # For Futures, direction is BUY (long) if exit > entry and pnl > 0, else SELL
                    if realized_pnl < 0 and sell_price > buy_price:
                        direction = "SELL"
                    elif realized_pnl > 0 and buy_price > sell_price:
                        direction = "SELL"
                        
                # Divide quantity by lot size to get lots count
                lot_size = get_lot_size(scrip_name)
                lots = raw_qty / lot_size if lot_size > 0 else raw_qty
                
                # Dates
                entry_date = BrokerParser.parse_groww_date(buy_date_str)
                
                trades.append({
                    "symbol": symbol.strip(),
                    "direction": direction,
                    "quantity": float(lots),
                    "entry_price": buy_price,
                    "exit_price": sell_price,
                    "strike_price": strike_price,
                    "pnl": realized_pnl,
                    "status": "CLOSED",
                    "asset_class": current_section,
                    "timestamp": entry_date.isoformat(),
                    "notes": f"Imported: {scrip_name}. Realized P&L: ₹{realized_pnl:.2f}",
                })
        return trades
