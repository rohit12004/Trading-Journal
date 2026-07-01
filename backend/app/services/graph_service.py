import os
import json
import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from neo4j import GraphDatabase

from app.config import settings
from app.services.ai_service import ai_service

class ExtractedJournalEntities(BaseModel):
    emotions: List[str] = Field(
        default=[],
        description="Emotions felt or expressed in the journal entry, e.g. anxious, greedy, confident, disciplined, fearful."
    )
    strategies: List[str] = Field(
        default=[],
        description="Trading strategies discussed or used, e.g. VWAP breakout, EMA crossover, pullback, scalp."
    )
    mistakes: List[str] = Field(
        default=[],
        description="Trading mistakes made, e.g. FOMO, wide stop loss, overtrading, early exit, sizing too large."
    )
    key_learnings: List[str] = Field(
        default=[],
        description="Key lessons or rules learned/reinforced, e.g. stick to stop loss, preserve capital, do not chase."
    )
    summary: str = Field(
        description="A concise 1-sentence summary of the day's mindset and psychology."
    )

class GraphMemoryService:
    def __init__(self):
        self._driver = None

    @property
    def driver(self):
        if self._driver is None:
            try:
                self._driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
                )
            except Exception as e:
                print(f"[ERROR] Failed to connect to Neo4j database: {e}")
                raise e
        return self._driver

    def close(self):
        if self._driver is not None:
            self._driver.close()
            self._driver = None

    def extract_entities(self, content: str) -> ExtractedJournalEntities:
        """
        Use Gemini 3.5 Flash with structured JSON output schema to parse entities from a journal entry.
        """
        system_instruction = (
            "You are an expert trading psychology assistant. "
            "Your job is to analyze the user's daily trading journal and extract key psychological states, emotions, strategies, mistakes, and learnings."
        )
        prompt = f"Analyze the following daily journal entry and extract entities:\n\n{content}"
        
        try:
            interaction = ai_service.client.interactions.create(
                model="gemini-3.5-flash",
                input=prompt,
                system_instruction=system_instruction,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": ExtractedJournalEntities.model_json_schema(),
                }
            )
            
            raw_text = interaction.output_text
            if not raw_text and interaction.steps:
                last_step = interaction.steps[-1]
                if last_step.type == "model_output" and last_step.content:
                    raw_text = last_step.content[0].text
                    
            if raw_text:
                data = json.loads(raw_text)
                return ExtractedJournalEntities(**data)
            else:
                raise ValueError("No response text received from Gemini.")
        except Exception as e:
            print(f"[ERROR] Failed to extract entities from journal using Gemini: {e}")
            # Fallback values if extraction fails
            return ExtractedJournalEntities(
                emotions=[],
                strategies=[],
                mistakes=[],
                key_learnings=[],
                summary="Daily journal entry logged."
            )

    def add_journal_entry(self, user_id: str, journal_id: str, date: str, content: str) -> dict:
        """
        Extracts entities from the journal, writes the user/journal entry node and relations in Neo4j.
        """
        # 1. Parse entities using Gemini
        entities = self.extract_entities(content)
        
        # 2. Write to Neo4j
        # We ensure user_id and date strings are formatted correctly
        date_str = str(date)
        
        with self.driver.session() as session:
            # First, clean up any existing journal node on the same date for this user to allow clean updates
            session.run(
                "MATCH (u:User {id: $user_id})-[:LOGGED_JOURNAL]->(j:JournalEntry {date: $date}) "
                "DETACH DELETE j",
                user_id=user_id, date=date_str
            )
            
            # Create/Merge User node and create the JournalEntry node
            session.run(
                "MERGE (u:User {id: $user_id}) "
                "CREATE (j:JournalEntry {id: $journal_id, date: $date, content: $content, summary: $summary}) "
                "CREATE (u)-[:LOGGED_JOURNAL]->(j)",
                user_id=user_id, journal_id=journal_id, date=date_str, content=content, summary=entities.summary
            )
            
            # Create and link Emotion nodes
            for emotion in entities.emotions:
                session.run(
                    "MATCH (j:JournalEntry {id: $journal_id}) "
                    "MERGE (e:Emotion {name: $name}) "
                    "MERGE (j)-[:FEARED_OR_FELT]->(e)",
                    journal_id=journal_id, name=emotion.lower().strip()
                )
                
            # Create and link Strategy nodes
            for strategy in entities.strategies:
                session.run(
                    "MATCH (j:JournalEntry {id: $journal_id}) "
                    "MERGE (s:Strategy {name: $name}) "
                    "MERGE (j)-[:USED_STRATEGY]->(s)",
                    journal_id=journal_id, name=strategy.upper().strip()
                )
                
            # Create and link Mistake nodes
            for mistake in entities.mistakes:
                session.run(
                    "MATCH (j:JournalEntry {id: $journal_id}) "
                    "MERGE (m:Mistake {description: $desc}) "
                    "MERGE (j)-[:COMMITTED_MISTAKE]->(m)",
                    journal_id=journal_id, desc=mistake.strip()
                )
                
            # Create and link Learning nodes
            for learning in entities.key_learnings:
                session.run(
                    "MATCH (j:JournalEntry {id: $journal_id}) "
                    "MERGE (l:Learning {text: $text}) "
                    "MERGE (j)-[:REINFORCED_LEARNING]->(l)",
                    journal_id=journal_id, text=learning.strip()
                )
                
        return entities.model_dump()

    def query_context(self, user_id: str) -> str:
        """
        Queries Neo4j database to build a complete text summary of the user's trading graph context.
        """
        try:
            with self.driver.session() as session:
                # Query emotions count
                emotions_result = session.run(
                    "MATCH (u:User {id: $user_id})-[:LOGGED_JOURNAL]->(j)-[:FEARED_OR_FELT]->(e:Emotion) "
                    "RETURN e.name AS emotion, count(j) AS count ORDER BY count DESC",
                    user_id=user_id
                )
                emotions = [f"{record['emotion']} ({record['count']} times)" for record in emotions_result]
                
                # Query strategies count
                strategies_result = session.run(
                    "MATCH (u:User {id: $user_id})-[:LOGGED_JOURNAL]->(j)-[:USED_STRATEGY]->(s:Strategy) "
                    "RETURN s.name AS strategy, count(j) AS count ORDER BY count DESC",
                    user_id=user_id
                )
                strategies = [f"{record['strategy']} ({record['count']} times)" for record in strategies_result]
                
                # Query mistakes count
                mistakes_result = session.run(
                    "MATCH (u:User {id: $user_id})-[:LOGGED_JOURNAL]->(j)-[:COMMITTED_MISTAKE]->(m:Mistake) "
                    "RETURN m.description AS mistake, count(j) AS count ORDER BY count DESC",
                    user_id=user_id
                )
                mistakes = [f"{record['mistake']} ({record['count']} times)" for record in mistakes_result]
                
                # Query 5 most recent journal entries and their properties
                recent_result = session.run(
                    "MATCH (u:User {id: $user_id})-[:LOGGED_JOURNAL]->(j:JournalEntry) "
                    "OPTIONAL MATCH (j)-[:FEARED_OR_FELT]->(e:Emotion) "
                    "OPTIONAL MATCH (j)-[:USED_STRATEGY]->(s:Strategy) "
                    "RETURN j.date AS date, j.content AS content, collect(distinct e.name) AS emotions, collect(distinct s.name) AS strategies "
                    "ORDER BY j.date DESC LIMIT 5",
                    user_id=user_id
                )
                
                recent_entries = []
                for record in recent_result:
                    date_val = record["date"]
                    date_str = str(date_val)
                    
                    entry_summary = (
                        f"- Date: {date_str}\n"
                        f"  Emotions Felt: {', '.join(record['emotions']) if record['emotions'] else 'None'}\n"
                        f"  Strategies Used: {', '.join(record['strategies']) if record['strategies'] else 'None'}\n"
                        f"  Journal Entry: \"{record['content']}\""
                    )
                    recent_entries.append(entry_summary)
                    
            # Compile context
            context_lines = []
            context_lines.append("### User Trading Knowledge Graph Summary (from Neo4j)")
            context_lines.append(f"Emotions recorded: {', '.join(emotions) if emotions else 'None'}")
            context_lines.append(f"Strategies used: {', '.join(strategies) if strategies else 'None'}")
            context_lines.append(f"Mistakes made: {', '.join(mistakes) if mistakes else 'None'}")
            context_lines.append("\n### Recent Journal Entries & Mindset Logs:")
            if recent_entries:
                context_lines.extend(recent_entries)
            else:
                context_lines.append("No journal entries logged yet.")
                
            return "\n".join(context_lines)
        except Exception as e:
            print(f"[ERROR] Failed to query Neo4j graph context: {e}")
            return "No graph database context could be retrieved."

graph_memory_service = GraphMemoryService()
