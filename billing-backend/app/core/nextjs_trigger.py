"""
Next.js Rebuild Trigger - Forces Next.js to detect changes
"""
import os
from pathlib import Path
import time

class NextJSTrigger:
    """
    Forces Next.js dev server to detect addon changes
    """
    
    def __init__(self):
        self.frontend_dir = Path(__file__).parent.parent.parent.parent.parent / "billing-frontend"
    
    def trigger_rebuild(self, action: str = "install"):
        """
        Trigger Next.js rebuild by modifying a watched file
        """
        try:
            # Touch next.config.js to force rebuild
            config_file = self.frontend_dir / "next.config.js"
            
            if config_file.exists():
                # Update file modification time
                os.utime(config_file, None)
                print(f"  🔄 Triggered Next.js rebuild ({action})")
            else:
                # Create a trigger file
                trigger_file = self.frontend_dir / ".rebuild-trigger"
                with open(trigger_file, 'w') as f:
                    f.write(f"Rebuild: {action} at {time.time()}\n")
                print(f"  🔄 Created rebuild trigger")
            
            return True
            
        except Exception as e:
            print(f"  ⚠️  Rebuild trigger failed: {e}")
            return False

