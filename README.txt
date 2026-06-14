Creatures of Sense — sheet-based website files

Generated from uploaded Google Form response sheet.

Included works: 19
Excluded:
- 이보람 / 라라: treated as test row
- 안정원 duplicate: kept the later response only

Upload to GitHub repository root:
- index.html
- work.html
- data.js
- works/
- thumbnails/
- student_upload_map.csv

Important:
1. Each student zip must be unzipped and placed in the folder listed in student_upload_map.csv.
2. Each folder must contain index.html.
3. Thumbnail files should be renamed to the thumbnailPath in student_upload_map.csv.
4. data.js currently uses local links:
   link: "works/s학번/index.html"
5. Webcam / guitar works are set to displayMode: "external" so the page opens them in a new tab.

Detail page structure:
- Top: title, student name, tags, sense origin, description
- Work area: p5.js sketch
- Bottom: Interaction and Output only

Color palette:
--bg: #F6F5F0
--surface: #FFFFFF
--text: #111111
--muted: #73736E
--line: #DAD9D3
--accent: #007A53

Update: tags are displayed above the artwork frame, aligned to the right, instead of next to the student name.
