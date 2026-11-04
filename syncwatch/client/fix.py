import os

css_path = os.path.join("client", "src", "index.css")

if not os.path.exists(css_path):
    # Agar direct client folder ke andar ho
    css_path = os.path.join("src", "index.css")

if os.path.exists(css_path):
    with open(css_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Stripping extra dangling curly braces at the end
    cleaned = content.rstrip()
    
    # Check open vs close braces count
    open_count = cleaned.count('{')
    close_count = cleaned.count('}')
    
    while close_count > open_count and cleaned.endswith('}'):
        cleaned = cleaned[:-1].rstrip()
        close_count = cleaned.count('}')

    with open(css_path, "w", encoding="utf-8") as f:
        f.write(cleaned + "\n")
        
    print(f"Fixed: Removed extra brackets. Open: {open_count}, Closed: {close_count}")
else:
    print("CSS file not found. Check path!")