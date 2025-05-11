
AIMap เป็นโปรเจกต์ที่พัฒนาด้วย React และ Next.js โดยมีการผสาน AI เพื่อสร้าง Mind Map ที่มีความสามารถในการใช้งานและปรับแต่งได้หลากหลาย ดังนี้:

ส่วน AI
โฟลเดอร์หลัก: lib/ai-content.ts และ components/ai-content-modal.tsx
การทำงาน:
generateAIContent(topic: string):
ฟังก์ชันที่ใช้สร้างเนื้อหาจาก AI สำหรับหัวข้อที่กำหนด
ใช้การจำลองผลลัพธ์ (Simulated Content) หรือเรียก API จริงในระบบผลิต
AIContentModal:
โมดัลสำหรับแสดงผลเนื้อหาที่สร้างจาก AI
รองรับการถามตอบแบบ Chat โดยใช้ฟังก์ชัน handleSubmitQuestion เพื่อส่งคำถามไปยัง AI และแสดงผลลัพธ์กลับมา

ส่วน Main Mapping
โฟลเดอร์หลัก: components/mind-map.tsx และ components/enhanced-mind-map.tsx
การทำงาน:
ใช้ไลบรารี D3.js ในการสร้างโครงสร้าง Mind Map แบบ Radial Tree

ฟังก์ชันสำคัญ:
radialPoint(x, y):
แปลงพิกัดจาก Polar เป็น Cartesian
findMainBranchName(node):
ค้นหาสาขาหลักของโหนด
treeLayout:
ใช้ D3 Tree Layout สำหรับกำหนดโครงสร้าง Mind Map
การปรับแต่ง:
รองรับการซูมเข้า-ออก (zoomIn, zoomOut) และรีเซ็ตมุมมอง (resetView)
ใช้การคลิกเพื่อเปิดโมดัล AI Content

ส่วนการตกแต่ง (Styling)
โฟลเดอร์หลัก: styles/globals.css และ tailwind.config.ts
การทำงาน:
ใช้ Tailwind CSS เพื่อจัดการสไตล์
กำหนดตัวแปร CSS เช่น:
--background, --foreground: สำหรับธีมพื้นหลังและตัวอักษร
--primary, --secondary: สีหลักและสีรอง
รองรับธีมแบบ Dark/Light ผ่าน ThemeProvider
ส่วนการส่งการทำงาน
โฟลเดอร์หลัก: lib/gemini.ts

การทำงาน:
ฟังก์ชัน generateMindMap(prompt: string):
ใช้ Google Gemini AI ในการสร้าง Mind Map จากข้อความ Prompt
โครงสร้างผลลัพธ์เป็น JSON ที่มีหัวข้อหลัก (topic) และสาขา (children)
การเขียน Prompt
โฟลเดอร์หลัก: lib/gemini.ts
การทำงาน:
สร้างข้อความ Prompt ที่มีคำแนะนำชัดเจน เช่น:
"สร้าง Mind Map ที่มีหัวข้อหลักและสาขาย่อยไม่เกิน 4-6 สาขา"
ปรับแต่งโครงสร้างเพื่อลดความซับซ้อนและเพิ่มความเข้าใจได้ง่าย
