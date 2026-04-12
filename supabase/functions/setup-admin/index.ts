import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const adminEmail = "admin@missingchild.com";
    const adminPassword = "admin123";

    // Check if admin already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find((u: any) => u.email === adminEmail);

    if (existingAdmin) {
      // Ensure profile and role exist
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", existingAdmin.id)
        .single();

      if (!profile) {
        await supabase.from("profiles").insert({
          id: existingAdmin.id,
          full_name: "System Admin",
          email: adminEmail,
          phone: "0000000000",
          role: "admin",
          status: "verified",
          verified: true,
          guardian_declaration: false,
          has_children: false,
        });
      }

      const { data: roleExists } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", existingAdmin.id)
        .eq("role", "admin")
        .single();

      if (!roleExists) {
        await supabase.from("user_roles").insert({
          user_id: existingAdmin.id,
          role: "admin",
        });
      }

      return new Response(JSON.stringify({ message: "Admin already exists, ensured profile and role." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (createError) throw createError;

    // Create profile
    await supabase.from("profiles").insert({
      id: newUser.user.id,
      full_name: "System Admin",
      email: adminEmail,
      phone: "0000000000",
      role: "admin",
      status: "verified",
      verified: true,
      guardian_declaration: false,
      has_children: false,
    });

    // Assign admin role
    await supabase.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "admin",
    });

    return new Response(JSON.stringify({ message: "Admin created successfully!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
