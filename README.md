# Sunny's Logistic System

ระบบ Sunny's Logistic System ออกแบบมาให้สามารถ จัดการลูกค้า ที่อยู่ลูกค้า รถ พนักงานขับรถ ผู้ใช้งานระบบ และคิวงานในระบบ 

สามารถติดตามตำแหน่งของรถในบริษัทได้ทันทีผ่าน Smart Phone ของพนักงานขับรถ มีการเก็บประวัติตำแหน่งของรถ

<img width="1902" height="914" alt="image" src="https://github.com/user-attachments/assets/a54e9562-b906-4c1a-9178-4fdcd56930b7" />

## Supported Browser

สามารถทำงานได้บน Web Browser (Google Chrome) และ Android Application สามารถส่งพิกัดตำแหน่งปัจจุบันได้อย่างแม่นยำ โดยรองรับการส่งพิกัดแบบพื้นหลัง (Background Process) บน Android Web View

## Technologies

ถูกเขียนขึ้นโดย Express.js บน Node.js โดยสามารถประมวลผลทั้งแบบ Server-side และ Client-side โดยจะเน้นไปที่การประมวลผลแบบ Server-side เป็นส่วนใหญ่ การคำนวณเส้นทางจะเป็นการจัดลำดับความสำคัญของเวลาที่นัดลูกค้าก่อน 
หากไม่ได้นัดลูกค้าไว้ระบบจะเลือกจุดที่ใกล้กับคนขับที่สุดในการกำหนดคิวส่งสินค้า

<img width="1377" height="616" alt="Screenshot 2026-09-14 135911" src="https://github.com/user-attachments/assets/f42a45aa-78d7-4107-8e8a-6a42888b1c75" />

## การติดตั้ง

ไปที่ /installation เพื่อติดตั้งระบบ โดยระบบจะแสดงสถานะตารางที่ต้องติดตั้ง

<img width="1900" height="906" alt="image" src="https://github.com/user-attachments/assets/940e664d-d687-485f-91b4-cf48e54d1451" />

ให้ดำเนินการติดตั้งจนกว่าจะเสร็จสมบูรณ์

<img width="1915" height="906" alt="image" src="https://github.com/user-attachments/assets/594f8125-02ab-4481-8110-6146b3d37ada" />

เข้าสู่ระบบที่ /login โดยหากเป็นการติดตั้งครั้งแรก Username และ Password เริ่มต้นจะเป็น administrator

<img width="1378" height="620" alt="image" src="https://github.com/user-attachments/assets/b2197014-3c50-47c7-a64e-02d4067b725c" />
