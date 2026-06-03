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
          const { results: res } = await env.DB.prepare("SELECT * FROM Resource_Links ORDER BY Category, Title").all();
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
          const { results } = await env.DB.prepare("SELECT User_ID as id, Username as username, Name as name, Avatar as avatar FROM Users WHERE Username = ? AND Password = ?")
            .bind(body.username, body.password)
            .all();
            
          if (results.length > 0) {
            return new Response(JSON.stringify({ status: "success", user: results[0] }), { headers: { "content-type": "application/json", ...corsHeaders } });
          }
          return new Response(JSON.stringify({ status: "error", message: "Invalid credentials" }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        // --- ACTION: UPDATE PROFILE ---
        if (body.action === 'update_profile') {
          if (body.newPassword) {
            await env.DB.prepare("UPDATE Users SET Name = ?, Avatar = ?, Password = ? WHERE User_ID = ?")
              .bind(body.name, body.avatar, body.newPassword, body.id).run();
          } else {
            await env.DB.prepare("UPDATE Users SET Name = ?, Avatar = ? WHERE User_ID = ?")
              .bind(body.name, body.avatar, body.id).run();
          }
          return new Response(JSON.stringify({ status: "success", newAvatar: body.avatar }), { headers: { "content-type": "application/json", ...corsHeaders } });
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
