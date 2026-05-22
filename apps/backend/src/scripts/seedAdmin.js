import { v4 as uuidv4 } from "uuid";
import pkg from "../configs/supabase.js";
import dotenv from "dotenv";

dotenv.config();
const { supabase, supabaseAdmin } = pkg;

const DEFAULT_ADMIN = {
  username: "admin",
  email: "admin@ecommerce.com",
  password: "Admin@123456",
};

async function seedAdmin() {
  try {
    console.log("Starting admin seed...");

    // kiểm tra user trong db
    const { data: existingAdmin } = await supabase
      .from("User")
      .select("id")
      .eq("email", DEFAULT_ADMIN.email)
      .single();

    if (existingAdmin) {
      console.log("Admin already exists in DB");
      return;
    }
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: DEFAULT_ADMIN.email,
      password: DEFAULT_ADMIN.password,
      email_confirm: true,
      user_metadata: {
        display_name: DEFAULT_ADMIN.username,
        phone: null,
        provider_type: "email",
        role: "ADMIN",
      },
    });

    if (error) throw error;
    const authUser = data.user;

    const { error: userError } = await supabase.from("User").insert({
      id: authUser.id,
      username: DEFAULT_ADMIN.username,
      email: DEFAULT_ADMIN.email,
      role: "ADMIN",
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      throw userError;
    }

    // insert bảng admin
    const { error: adminError } = await supabase.from("Admin").insert({
      id: uuidv4(),
      userId: authUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (adminError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      throw adminError;
    }

    console.log("Admin seeded successfully");
    console.log("Email:", DEFAULT_ADMIN.email);
    console.log("Password:", DEFAULT_ADMIN.password);
  } catch (err) {
    console.error("Seed admin failed:", err.message);
    process.exit(1);
  }
}

seedAdmin();
