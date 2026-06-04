// worker/worker.js

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Strict CORS Configuration using Environment Variables (No Fallback)
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN, 
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ==========================================
    // GET: FETCH DATA
    // ==========================================
    if (request.method === "GET" && url.pathname === "/api/data") {
      try {
        const path = url.searchParams.get("path");
        let results;

        if (path === 'resources') {
          // Fetch resources, excluding soft-deleted items
          const { results: res } = await env.DB.prepare("SELECT * FROM Resource_Links WHERE Is_Deleted IS NULL OR Is_Deleted = 0 ORDER BY Category, Title").all();
          results = res;
        } else {
          const { results: res } = await env.DB.prepare("SELECT * FROM Teaching_Hours ORDER BY Date DESC").all();
          results = res;
        }
        
        return new Response(JSON.stringify(results), { 
          headers: { "content-type": "application/json", ...corsHeaders } 
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Database fetch failed", details: error.message }), { 
          status: 500, headers: { "content-type": "application/json", ...corsHeaders } 
        });
      }
    }

    // ==========================================
    // POST: EXECUTE ACTIONS
    // ==========================================
    if (request.method === "POST" && url.pathname === "/api/action") {
      try {
        const body = await request.json();

        // --- ACTION: LOGIN ---
        if (body.action === 'login') {
          // Added Email and Contact_Number to the SELECT statement
          const { results } = await env.DB.prepare("SELECT User_ID as id, Username as username, Name as name, Avatar as avatar, Email as email, Contact_Number as contact FROM Users WHERE Username = ? AND Password = ?")
            .bind(body.username, body.password)
            .all();
            
          if (results.length > 0) {
            return new Response(JSON.stringify({ status: "success", user: results[0] }), { headers: { "content-type": "application/json", ...corsHeaders } });
          }
          return new Response(JSON.stringify({ status: "error", message: "Invalid credentials" }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        // --- ACTION: UPDATE DETAILS ---
        if (body.action === 'update_details') {
          await env.DB.prepare("UPDATE Users SET Name = ?, Username = ?, Email = ?, Contact_Number = ? WHERE User_ID = ?")
            .bind(body.name, body.username, body.email, body.contact, body.id).run();
            
          return new Response(JSON.stringify({ status: "success" }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        // --- ACTION: UPDATE AVATAR ---
        if (body.action === 'update_avatar') {
          // Validates password directly in the query
          const result = await env.DB.prepare("UPDATE Users SET Avatar = ? WHERE User_ID = ? AND Password = ?")
            .bind(body.avatar, body.id, body.password).run();
            
          if (result.meta.changes > 0) {
            return new Response(JSON.stringify({ status: "success", newAvatar: body.avatar }), { headers: { "content-type": "application/json", ...corsHeaders } });
          } else {
            return new Response(JSON.stringify({ status: "error", message: "Incorrect password" }), { headers: { "content-type": "application/json", ...corsHeaders } });
          }
        }

        // --- ACTION: UPDATE PASSWORD ---
        if (body.action === 'update_password') {
           // Validates current password directly in the query
          const result = await env.DB.prepare("UPDATE Users SET Password = ? WHERE User_ID = ? AND Password = ?")
            .bind(body.newPassword, body.id, body.currentPassword).run();
            
          if (result.meta.changes > 0) {
            return new Response(JSON.stringify({ status: "success" }), { headers: { "content-type": "application/json", ...corsHeaders } });
          } else {
            return new Response(JSON.stringify({ status: "error", message: "Incorrect current password" }), { headers: { "content-type": "application/json", ...corsHeaders } });
          }
        }

        // --- ACTION: ADD TEACHING HOURS (BATCH) ---
        if (body.action === 'add_hours_batch') {
          const hourlyRate = 400;
          const stmt = env.DB.prepare(`
            INSERT INTO Teaching_Hours 
            (Entry_ID, Date, Start_Time, End_Time, Total_Hours, University, College, Subject_Code, Payment_Status, Date_Paid, Total_Earnings) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid', NULL, ?)
          `);

          // Create an array of prepared statements for D1 batch execution
          const batchList = body.records.map(record => {
            const totalEarnings = parseFloat(record.Total_Hours || 0) * hourlyRate;
            const entryId = crypto.randomUUID();
            return stmt.bind(
              entryId, record.Date, record.Start_Time || '', record.End_Time || '', record.Total_Hours, 
              record.University, record.College, record.Subject_Code, totalEarnings
            );
          });

          await env.DB.batch(batchList);
          return new Response(JSON.stringify({ status: "success", count: batchList.length }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        // --- ACTION: UPDATE PAYMENT ---
        if (body.action === 'update_payment') {
          const placeholders = body.entryIds.map(() => '?').join(',');
          const query = `UPDATE Teaching_Hours SET Payment_Status = 'Paid', Date_Paid = ? WHERE Entry_ID IN (${placeholders})`;
          
          await env.DB.prepare(query).bind(body.datePaid, ...body.entryIds).run();
          
          return new Response(JSON.stringify({ status: "success" }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        // --- ACTION: ADD RESOURCE ---
        if (body.action === 'add_resource') {
          const resourceId = crypto.randomUUID();
          await env.DB.prepare("INSERT INTO Resource_Links (Resource_ID, Category, Title, URL, Is_Deleted) VALUES (?, ?, ?, ?, 0)")
            .bind(resourceId, body.category, body.title, body.url).run();
          return new Response(JSON.stringify({ status: "success", resourceId }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        // --- ACTION: EDIT RESOURCE ---
        if (body.action === 'edit_resource') {
          await env.DB.prepare("UPDATE Resource_Links SET Category = ?, Title = ?, URL = ? WHERE Resource_ID = ?")
            .bind(body.category, body.title, body.url, body.resourceId).run();
          return new Response(JSON.stringify({ status: "success" }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        // --- ACTION: DELETE RESOURCE (SOFT DELETE) ---
        if (body.action === 'delete_resource') {
          await env.DB.prepare("UPDATE Resource_Links SET Is_Deleted = 1 WHERE Resource_ID = ?")
            .bind(body.resourceId).run();
          return new Response(JSON.stringify({ status: "success" }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        return new Response(JSON.stringify({ status: "error", message: "Unknown action" }), { headers: { "content-type": "application/json", ...corsHeaders } });

      } catch (error) {
        return new Response(JSON.stringify({ status: "error", message: error.message }), { 
          status: 500, headers: { "content-type": "application/json", ...corsHeaders } 
        });
      } 
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), { 
      status: 404, headers: { "content-type": "application/json", ...corsHeaders } 
    });
  },
};
