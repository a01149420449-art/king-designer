const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

/* ===== SECURITY CONFIG ===== */

const ENC_KEY = crypto.createHash("sha256")
    .update("KingDesigner_Super_Secret_Key")
    .digest();

const algorithm = "aes-256-gcm";

/* ===== DATABASE (تجريبي — استبدله بـ MongoDB لاحقًا) ===== */

let messages = [];

/* ===== ENCRYPT / DECRYPT ===== */

function encrypt(text) {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, ENC_KEY, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
        iv: iv.toString("hex"),
        tag: authTag.toString("hex"),
        data: encrypted
    };
}

function decrypt(obj) {
    const decipher = crypto.createDecipheriv(
        algorithm,
        ENC_KEY,
        Buffer.from(obj.iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(obj.tag, "hex"));

    let decrypted = decipher.update(obj.data, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

/* ===== API ===== */

// حفظ رسالة مشفرة في السيرفر
app.post("/api/send", (req, res) => {
    const { text } = req.body;

    if (!text || text.length > 500)
        return res.status(400).json({ error: "Invalid message" });

    const encrypted = encrypt(text);

    messages.push({
        role: "user",
        text: encrypted,
        time: new Date().toLocaleTimeString("ar-EG")
    });

    res.json({ success: true });
});

// جلب الرسائل وفك التشفير
app.get("/api/messages", (req, res) => {

    const decrypted = messages.map(m => ({
        role: m.role,
        text: decrypt(m.text),
        time: m.time
    }));

    res.json(decrypted);
});

app.listen(3000, () => console.log("🔥 Secure Server Running"));