#!/usr/bin/env python3
"""Query what constraints apply to a planned change - PRIMARY tool for agents"""
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import sys

try:
    from rag_config import *
except ImportError:
    print("❌ rag_config.py not found. Run setup_rag.py first.")
    sys.exit(1)

class ConstraintChecker:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False)
        )
        self.model = SentenceTransformer(EMBEDDING_MODEL)
    
    def check(self, planned_change, num_results=5):
        print(f"\n🔍 Checking constraints for: '{planned_change}'\n")
        
        constraints = self._query_collection(COLLECTION_CONSTRAINTS, planned_change, num_results)
        patterns = self._query_collection(COLLECTION_PATTERNS, planned_change, num_results)
        examples = self._query_collection(COLLECTION_CODE, planned_change, num_results)
        
        self._print_results(constraints, patterns, examples)
        
        return {"constraints": constraints, "patterns": patterns, "examples": examples}
    
    def _query_collection(self, collection_name, query, n):
        try:
            collection = self.client.get_collection(collection_name)
            query_embedding = self.model.encode(query).tolist()
            results = collection.query(query_embeddings=[query_embedding], n_results=n)
            return self._format_results(results)
        except:
            return []
    
    def _format_results(self, results):
        formatted = []
        if not results['ids'] or not results['ids'][0]:
            return formatted
        
        for i in range(len(results['ids'][0])):
            formatted.append({
                "content": results['documents'][0][i],
                "metadata": results['metadatas'][0][i],
                "distance": results['distances'][0][i]
            })
        return formatted
    
    def _print_results(self, constraints, patterns, examples):
        print("=" * 80)
        print("🚨 CONSTRAINTS (MUST FOLLOW)")
        print("=" * 80)
        
        if constraints:
            for i, result in enumerate(constraints, 1):
                print(f"\n[{i}] {result['metadata'].get('file_path', 'Unknown')}")
                print(f"Relevance: {1 - result['distance']:.2%}")
                print("-" * 80)
                relevant = self._extract_relevant_sections(result['content'])
                print(relevant[:500])
                print()
        else:
            print("⚠️  No specific constraints found. Review ARCHITECTURE.yml manually.\n")
        
        print("=" * 80)
        print("📚 PATTERNS TO FOLLOW")
        print("=" * 80)
        
        if patterns:
            for i, result in enumerate(patterns, 1):
                print(f"\n[{i}] {result['metadata'].get('file_path', 'Unknown')}")
                print(f"Relevance: {1 - result['distance']:.2%}")
                print("-" * 80)
                print(result['content'][:400])
                print()
        else:
            print("⚠️  No patterns found. Check docs/patterns/ directory.\n")
        
        print("=" * 80)
        print("💡 CODE EXAMPLES")
        print("=" * 80)
        
        if examples:
            for i, result in enumerate(examples[:3], 1):
                print(f"\n[{i}] {result['metadata'].get('file_path', 'Unknown')}")
                print(f"Relevance: {1 - result['distance']:.2%}")
                print("-" * 80)
                print(result['content'][:300])
                print()
        else:
            print("⚠️  No relevant code examples found.\n")
    
    def _extract_relevant_sections(self, content):
        lines = content.split('\n')
        relevant = []
        
        for line in lines:
            if any(kw in line.lower() for kw in [
                'must', 'never', 'always', 'required', 'critical',
                '❌', '✅', 'warning', 'error'
            ]):
                relevant.append(line)
        
        return '\n'.join(relevant) if relevant else content

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_constraints.py \"planned change description\"")
        print("\nExample:")
        print("  python check_constraints.py \"add new authentication endpoint\"")
        sys.exit(1)
    
    planned_change = " ".join(sys.argv[1:])
    num_results = int(sys.argv[-1]) if sys.argv[-1].isdigit() else 5
    
    checker = ConstraintChecker()
    checker.check(planned_change, num_results)
