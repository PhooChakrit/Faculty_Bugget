# Deploy ขึ้นเซิร์ฟเวอร์คณะ (acadservice.sc.chula.ac.th)

เซิร์ฟเวอร์: Ubuntu 26.04, IP `161.200.118.38`, SSH port `212`

โครงสร้าง: `Caddy (HTTPS :443)` → `web (Next.js, 127.0.0.1:3000)` → `db (PostgreSQL ใน Docker network)`

> ⚠️ แอปยังไม่มีระบบ login: role เลือกจาก dropdown ฝั่ง client แล้วส่ง `actorRole`/`actorUserId`
> มาให้ API ซึ่งเชื่อค่านั้นตรงๆ ถ้าเปิดสู่ internet ใครก็อนุมัติงบ/อัปโหลดไฟล์แทนทุก role ได้
> ต้องจำกัดการเข้าถึงก่อน (ดูขั้นที่ 6) จนกว่าจะมี authentication จริง

## 0. ติดตั้งครั้งแรก
```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-v2 caddy
sudo systemctl enable --now docker
sudo ufw allow 212/tcp     # SSH อยู่ที่ 212 ไม่ใช่ 22
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## 1. ดึงโค้ด
```bash
sudo mkdir -p /srv/faculty-budget && sudo chown $USER: /srv/faculty-budget
git clone https://github.com/PhooChakrit/Faculty_Bugget.git /srv/faculty-budget
cd /srv/faculty-budget
```
ถ้า repo เป็น private ให้ใช้ Deploy key (read-only) โดยให้เจ้าของ repo เป็นคนเพิ่ม key

## 2. ตั้งค่า environment
```bash
cp env.production.example .env.production
chmod 600 .env.production
openssl rand -hex 24        # เอาไปใส่ POSTGRES_PASSWORD และใน DATABASE_URL
nano .env.production
```

## 3. Build + สร้างตาราง
```bash
sudo docker compose -f compose.prod.yml build
sudo docker compose -f compose.prod.yml up -d db
sudo docker compose -f compose.prod.yml run --rm migrate
# ครั้งแรกเท่านั้น ถ้าต้องการข้อมูลตั้งต้น (ห้ามรัน seed-mock-data / seed-demo-projects บน production)
sudo docker compose -f compose.prod.yml run --rm migrate npm run seed
```

## 4. รันเว็บ
```bash
sudo docker compose -f compose.prod.yml up -d web
sudo docker compose -f compose.prod.yml ps
curl -I http://127.0.0.1:3000
```

## 5. Caddy (HTTPS อัตโนมัติ)
`/etc/caddy/Caddyfile`
```
acadservice.sc.chula.ac.th, www.acadservice.sc.chula.ac.th {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
}
```
```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo journalctl -u caddy -n 50 --no-pager
```

## 6. จำกัดการเข้าถึง (จนกว่าจะมีระบบ login)
เลือกอย่างใดอย่างหนึ่งหรือทั้งสองอย่าง ใส่ไว้ใน site block ก่อน `reverse_proxy`

**ให้เข้าได้เฉพาะ network มหาลัย** (ยืนยัน IP range และ VPN กับ IT ก่อน)
```
    @outside not remote_ip 161.200.0.0/16
    respond @outside "Forbidden" 403
```

**ใส่รหัสผ่านกลาง** (สร้าง hash ด้วย `caddy hash-password`)
```
    basic_auth {
        staff <HASH>
    }
```

## 7. อัปเดตเวอร์ชันใหม่
```bash
cd /srv/faculty-budget
git pull --ff-only
sudo docker compose -f compose.prod.yml build
sudo docker compose -f compose.prod.yml run --rm migrate
sudo docker compose -f compose.prod.yml up -d web
sudo docker image prune -f
```

## 8. Backup ฐานข้อมูล
ไฟล์แนบทั้งหมด (excel, cost center, report ฯลฯ) เก็บเป็น `Bytes` ใน DB ดังนั้น backup DB = backup ทุกอย่าง
```bash
sudo mkdir -p /srv/backups
sudo docker compose -f /srv/faculty-budget/compose.prod.yml exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip | sudo tee /srv/backups/db-$(date +%F).sql.gz >/dev/null
```

## Troubleshooting
```bash
sudo docker compose -f compose.prod.yml logs -f web
sudo docker compose -f compose.prod.yml logs db
nc -zv smtp.gmail.com 587    # เช็กว่ามหาลัยบล็อก SMTP ขาออกไหม (ส่งเมลไม่ออก)
```
