#!/usr/bin/env python3
"""Verify RAG system is working correctly"""
import chromadb
from chromadb.config import Settings
import sys

try:
    from rag_config import *
except ImportError:
    print("❌ rag_config.py not found. Run setup_rag.py first.")
    sys.exit(1)

def health_check():
    print("🏥 Running RAG Health Check...\n")
    
    issues = []
    warnings = []
    
    try:
        client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Check collections exist
        collections = client.list_collections()
        collection_names = [c.name for c in collections]
        
        print("📚 Collections:")
        for name in [COLLECTION_CODE, COLLECTION_CONSTRAINTS, COLLECTION_PATTERNS]:
            if name in collection_names:
                print(f"  ✅ {name}")
            else:
                issues.append(f"Missing collection: {name}")
                print(f"  ❌ {name}")
        
        # Check collection sizes
        print("\n📊 Collection Sizes:")
        for name in collection_names:
            collection = client.get_collection(name)
            count = collection.count()
            print(f"  {name}: {count} chunks")
            
            if count == 0:
                warnings.append(f"Empty collection: {name}")
        
        # Check for constraint files
        print("\n📋 Constraint Files:")
        constraint_files = [
            PROJECT_ROOT / "ARCHITECTURE.yml",
            PROJECT_ROOT / "CONSTRAINTS.md",
        ]
        
        for file_path in constraint_files:
            if file_path.exists():
                print(f"  ✅ {file_path.name}")
            else:
                warnings.append(f"Missing: {file_path.name}")
                print(f"  ⚠️  {file_path.name}")
        
        # Test query
        print("\n🔍 Testing Query:")
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer(EMBEDDING_MODEL)
            
            collection = client.get_collection(COLLECTION_CODE)
            test_embedding = model.encode("authentication").tolist()
            results = collection.query(query_embeddings=[test_embedding], n_results=1)
            
            if results['ids'] and results['ids'][0]:
                print("  ✅ Query successful")
            else:
                issues.append("Query returned no results")
                print("  ❌ Query failed")
        except Exception as e:
            issues.append(f"Query test failed: {str(e)}")
            print(f"  ❌ {str(e)}")
        
    except Exception as e:
        issues.append(f"Failed to connect to ChromaDB: {str(e)}")
    
    # Summary
    print("\n" + "=" * 80)
    if issues:
        print("❌ CRITICAL ISSUES:")
        for issue in issues:
            print(f"  - {issue}")
        print("\n💡 Fix: Run 'python index_codebase.py'")
        sys.exit(1)
    elif warnings:
        print("⚠️  WARNINGS:")
        for warning in warnings:
            print(f"  - {warning}")
        print("\n✅ System operational but could be improved")
        sys.exit(0)
    else:
        print("✅ All checks passed! RAG system is healthy.")
        sys.exit(0)

if __name__ == "__main__":
    health_check()
