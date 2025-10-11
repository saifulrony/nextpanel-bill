# Fix VMware Copy-Paste Issue

## Quick Fix (Try First)

### Option 1: Install VMware Tools
```bash
# For Ubuntu/Debian
sudo apt-get update
sudo apt-get install open-vm-tools open-vm-tools-desktop -y

# Restart VM
sudo reboot
```

### Option 2: Enable in VMware Settings
1. VM menu → Settings
2. Options tab → Guest Isolation
3. Check "Enable copy and paste"
4. Check "Enable drag and drop"
5. Click OK
6. Restart VM

### Option 3: Quick Terminal Command
```bash
# Restart VMware tools
sudo systemctl restart open-vm-tools
```

---

## 🌐 Work Within VM (No Copy-Paste Needed)

### Open URLs in VM Browser
```bash
# Install Firefox if not installed
sudo apt install firefox -y

# Open URLs directly
firefox https://www.namecheap.com &
firefox https://www.domainnameapi.com &
firefox http://localhost:3000 &
```

### Or use text browser (no GUI needed)
```bash
# Install lynx (text browser)
sudo apt install lynx -y

# Browse websites in terminal
lynx https://www.namecheap.com
```

---

## 📱 Alternative: Use Your Phone

1. Take photo of VM screen
2. Open URLs on your phone
3. Complete signup on phone
4. Type credentials manually into VM

---

## ✅ Easiest Solution: I'll Create Everything in Your VM!

No need to copy-paste. I'll create all files and scripts directly in your VM!

