"""
Auto-rebuild frontend after plugin install/uninstall
This is required for Next.js file-based routing to recognize new routes
"""
import subprocess
import os
from pathlib import Path

class FrontendRebuilder:
    """
    Handles automatic frontend rebuild after plugin changes
    Required for Next.js to recognize added/removed routes
    """
    
    def __init__(self):
        self.frontend_dir = Path(__file__).parent.parent.parent.parent.parent / "billing-frontend"
    
    def trigger_rebuild(self, action: str = "install"):
        """
        Trigger a frontend rebuild
        This makes Next.js recognize new/removed routes
        """
        try:
            print(f"🔄 Triggering frontend rebuild after {action}...")
            
            # Create a trigger file that the frontend dev server watches
            trigger_file = self.frontend_dir / ".rebuild-trigger"
            
            # Touch the file to trigger Next.js hot reload
            with open(trigger_file, 'w') as f:
                import datetime
                f.write(f"Rebuild triggered at {datetime.datetime.now()}\n")
                f.write(f"Action: {action}\n")
            
            print(f"  ✅ Rebuild triggered")
            print(f"  ⏱️  Next.js will hot-reload in ~5-10 seconds")
            
            return True
            
        except Exception as e:
            print(f"  ⚠️  Failed to trigger rebuild: {e}")
            print(f"  ℹ️  You may need to manually restart the frontend")
            return False
    
    def notify_user(self):
        """Return user notification about rebuild"""
        return {
            "message": "Plugin files updated. Frontend is rebuilding...",
            "estimated_time": "5-10 seconds",
            "action": "Please wait for hot-reload to complete, then refresh the page."
        }

