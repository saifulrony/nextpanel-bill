#!/usr/bin/env python3
"""
Clean up existing chat tables
They should only exist when the ai_chatbot plugin is installed
"""
import sqlite3
import os

db_path = "billing.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("🗑️  Cleaning up existing chat tables...")
    
    try:
        cursor.execute("DROP TABLE IF EXISTS chat_messages")
        print("  ✅ Dropped chat_messages table")
    except Exception as e:
        print(f"  ⚠️  chat_messages: {e}")
    
    try:
        cursor.execute("DROP TABLE IF EXISTS chat_sessions")
        print("  ✅ Dropped chat_sessions table")
    except Exception as e:
        print(f"  ⚠️  chat_sessions: {e}")
    
    conn.commit()
    conn.close()
    
    print("\n✅ Cleanup complete!")
    print("These tables will be created again when you install the ai_chatbot plugin.")
else:
    print(f"❌ Database not found: {db_path}")

