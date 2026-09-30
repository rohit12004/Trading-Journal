"""
Database Reset Utility Script for QuantCoach AI / Trading Journal.
This script wipes out all application data across MySQL and Neo4j graph database.

Usage:
    python reset_db.py [--force]
"""

import sys
import argparse
from sqlalchemy import text
from app.db.session import engine
from app.config import settings

def reset_mysql_database():
    print("\n[1/3] Resetting MySQL Database tables...")
    tables_to_clear = [
        "trades",
        "journal_entries",
        "capital_transactions",
        "refresh_tokens",
        "accounts",
        "users"
    ]
    
    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        for table in tables_to_clear:
            try:
                conn.execute(text(f"TRUNCATE TABLE `{table}`;"))
                print(f"  [OK] Cleared table: {table}")
            except Exception as e:
                # If TRUNCATE fails (e.g. table doesn't exist), try DELETE
                try:
                    conn.execute(text(f"DELETE FROM `{table}`;"))
                    print(f"  [OK] Deleted all rows from table: {table}")
                except Exception as inner_e:
                    print(f"  [WARN] Could not clear table {table}: {inner_e}")
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
    print("  --> MySQL Database reset successfully.")

def reset_neo4j_database():
    print("\n[2/3] Resetting Neo4j Graph Database...")
    try:
        from neo4j import GraphDatabase
        driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )
        with driver.session() as session:
            result = session.run("MATCH (n) DETACH DELETE n RETURN count(n) as deleted_count")
            summary = result.single()
            deleted_count = summary["deleted_count"] if summary else 0
            print(f"  [OK] Detached & deleted {deleted_count} nodes/relationships from Neo4j.")
        driver.close()
        print("  --> Neo4j Graph Database reset successfully.")
    except Exception as e:
        print(f"  [WARN] Failed to reset Neo4j Graph Database: {e}")

def reset_redis_cache():
    print("\n[3/3] Resetting Redis Cache...")
    try:
        import redis
        r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
        r.flushdb()
        print("  [OK] Flushed Redis cache.")
        print("  --> Redis cache reset successfully.")
    except Exception as e:
        print(f"  [INFO] Redis reset skipped or unavailable: {e}")

def main():
    parser = argparse.ArgumentParser(description="Wipe all application data from MySQL, Neo4j, and Redis.")
    parser.add_argument("--force", "-f", action="store_true", help="Skip interactive confirmation prompt")
    args = parser.parse_args()

    if not args.force:
        print("===============================================================")
        print(" WARNING: THIS WILL PERMANENTLY DELETE ALL DATA FROM DATABASE!")
        print(" Users, Trades, Journal Entries, Transactions & Graph Memory")
        print("===============================================================")
        confirm = input("Are you sure you want to proceed with full wipeout? (y/N): ")
        if confirm.strip().lower() not in ["y", "yes"]:
            print("Operation cancelled.")
            sys.exit(0)

    print("\nStarting complete database wipeout...")
    reset_mysql_database()
    reset_neo4j_database()
    reset_redis_cache()
    print("\n===============================================================")
    print(" [SUCCESS] DATABASE HAS BEEN COMPLETELY EMPTIED & RESET!")
    print(" You can now start fresh.")
    print("===============================================================\n")

if __name__ == "__main__":
    main()
