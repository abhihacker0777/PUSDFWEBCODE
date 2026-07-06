const bcrypt = require("bcryptjs");

const password = process.argv.slice(2).join(" ");
const cost = Math.min(14, Math.max(12, Number(process.env.PASSWORD_BCRYPT_COST) || 12));

if (!password) {
  console.error("Usage: npm run hash-admin-password -- \"your-long-admin-password\"");
  process.exit(1);
}

if (!/^[\x20-\x7E]{10,128}$/.test(password)) {
  console.error("Password must be 10-128 printable ASCII characters.");
  process.exit(1);
}

bcrypt.hash(password, cost)
  .then((hash) => {
    console.log(hash);
  })
  .catch((err) => {
    console.error("Failed to hash password:", err.message);
    process.exit(1);
  });
