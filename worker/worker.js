export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN, 
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "GET" && url.pathname === "/api/data") {
      try {
        const path = url.searchParams.get("path");
        const userId = url.searchParams.get("userId");
        let results;

        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized: Missing User ID" }), { 
            status: 401, headers: { "content-type": "application/json", ...corsHeaders } 
          });
        }

        if (path === 'resources') {
          const { results: res } = await env.DB.prepare("SELECT * FROM Resource_Links WHERE (Is_Deleted IS NULL OR Is_Deleted = 0) AND User_ID = ? ORDER BY Category, Title").bind(userId).all();
          results = res;
        } else {
          const { results: res } = await env.DB.prepare("SELECT * FROM Teaching_Hours WHERE User_ID = ? ORDER BY Date DESC").bind(userId).all();
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

    if (request.method === "POST" && url.pathname === "/api/action") {
      try {
        const body = await request.json();
        const userId = body.userId;

        if (body.action === 'login') {
          const { results } = await env.DB.prepare("SELECT User_ID as id, Username as username, Name as name, Avatar as avatar, Email as email, Contact_Number as contact FROM Users WHERE Username = ? AND Password = ?")
            .bind(body.username, body.password)
            .all();
            
          if (results.length > 0) {
            return new Response(JSON.stringify({ status: "success", user: results[0] }), { headers: { "content-type": "application/json", ...corsHeaders } });
          }
          return new Response(JSON.stringify({ status: "error", message: "Invalid credentials" }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (body.action === 'update_details') {
          await env.DB.prepare("UPDATE Users SET Name = ?, Username = ?, Email = ?, Contact_Number = ? WHERE User_ID = ?")
            .bind(body.name, body.username, body.email, body.contact, body.id).run();
            
          return new Response(JSON.stringify({ status: "success" }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (body.action === 'update_avatar') {
          const result = await env.DB.prepare("UPDATE Users SET Avatar = ? WHERE User_ID = ? AND Password = ?")
            .bind(body.avatar, body.id, body.password).run();
            
          if (result.meta.changes > 0) {
            return new Response(JSON.stringify({ status: "success", newAvatar: body.avatar }), { headers: { "content-type": "application/json", ...corsHeaders } });
          } else {
            return new Response(JSON.stringify({ status: "error", message: "Incorrect password" }), { headers: { "content-type": "application/json", ...corsHeaders } });
          }
        }

        if (body.action === 'update_password') {
          const result = await env.DB.prepare("UPDATE Users SET Password = ? WHERE User_ID = ? AND Password = ?")
            .bind(body.newPassword, body.id, body.currentPassword).run();
            
          if (result.meta.changes > 0) {
            return new Response(JSON.stringify({ status: "success" }), { headers: { "content-type": "application/json", ...corsHeaders } });
          } else {
            return new Response(JSON.stringify({ status: "error", message: "Incorrect current password" }), { headers: { "content-type": "application/json", ...corsHeaders } });
          }
        }

        // --- SCOPED ENDPOINTS (Require userId) ---
        if (!['login', 'update_details', 'update_avatar', 'update_password'].includes(body.action) && !userId) {
            return new Response(JSON.stringify({ status: "error", message: "Unauthorized: Missing User ID" }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (body.action === 'add_hours_batch') {
          const hourlyRate = 400;
          const stmt = env.DB.prepare(`
            INSERT INTO Teaching_Hours 
            (Entry_ID, User_ID, Date, Start_Time, End_Time, Total_Hours, University, College, Subject_Code, Payment_Status, Date_Paid, Total_Earnings) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid', NULL, ?)
          `);

          const batchList = body.records.map(record => {
            const totalEarnings = parseFloat(record.Total_Hours || 0) * hourlyRate;
            const entryId = crypto.randomUUID();
            return stmt.bind(
              entryId, userId, record.Date, record.Start_Time || '', record.End_Time || '', record.Total_Hours, 
              record.University, record.College, record.Subject_Code, totalEarnings
            );
          });

          await env.DB.batch(batchList);
          return new Response(JSON.stringify({ status: "success", count: batchList.length }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (body.action === 'update_payment') {
          const placeholders = body.entryIds.map(() => '?').join(',');
          const query = `UPDATE Teaching_Hours SET Payment_Status = 'Paid', Date_Paid = ? WHERE User_ID = ? AND Entry_ID IN (${placeholders})`;
          
          await env.DB.prepare(query).bind(body.datePaid, userId, ...body.entryIds).run();
          
          return new Response(JSON.stringify({ status: "success" }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (body.action === 'add_resource') {
          const resourceId = crypto.randomUUID();
          await env.DB.prepare("INSERT INTO Resource_Links (Resource_ID, User_ID, Category, Title, URL, Is_Deleted) VALUES (?, ?, ?, ?, ?, 0)")
            .bind(resourceId, userId, body.category, body.title, body.url).run();
          return new Response(JSON.stringify({ status: "success", resourceId }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (body.action === 'edit_resource') {
          await env.DB.prepare("UPDATE Resource_Links SET Category = ?, Title = ?, URL = ? WHERE Resource_ID = ? AND User_ID = ?")
            .bind(body.category, body.title, body.url, body.resourceId, userId).run();
          return new Response(JSON.stringify({ status: "success" }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (body.action === 'delete_resource') {
          await env.DB.prepare("UPDATE Resource_Links SET Is_Deleted = 1 WHERE Resource_ID = ? AND User_ID = ?")
            .bind(body.resourceId, userId).run();
          return new Response(JSON.stringify({ status: "success" }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (body.action === 'create_project') {
          const projectId = crypto.randomUUID();
          await env.DB.prepare("INSERT INTO Projects (Project_ID, User_ID, Name) VALUES (?, ?, ?)")
            .bind(projectId, userId, body.name).run();
          return new Response(JSON.stringify({ status: "success", projectId }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (body.action === 'get_projects') {
          let projects = [];
          try {
            const { results } = await env.DB.prepare("SELECT * FROM Projects WHERE User_ID = ? ORDER BY Created_At DESC").bind(userId).all();
            projects = results;
          } catch(e) { }
          return new Response(JSON.stringify({ status: "success", projects }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (body.action === 'get_project_ledger') {
          let transactions = [];
          try {
            const { results } = await env.DB.prepare("SELECT * FROM Finance_Transactions WHERE Project_ID = ? AND User_ID = ? ORDER BY Date DESC").bind(body.projectId, userId).all();
            transactions = results;
          } catch(e) { }
          return new Response(JSON.stringify({ status: "success", transactions }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (body.action === 'get_finance_ledger') {
          let transactions = [];
          try {
            const res = await env.DB.prepare("SELECT * FROM Finance_Transactions WHERE User_ID = ? ORDER BY Date DESC").bind(userId).all();
            transactions = res.results;
          } catch(e) { }

          const { results: teachingHours } = await env.DB.prepare("SELECT * FROM Teaching_Hours WHERE Payment_Status = 'Paid' AND User_ID = ? ORDER BY Date_Paid DESC").bind(userId).all();
          
          return new Response(JSON.stringify({ status: "success", transactions, teachingHours }), { headers: { "content-type": "application/json", ...corsHeaders } });
        }

        if (body.action === 'add_finance_records') {
          const stmt = env.DB.prepare(`
            INSERT INTO Finance_Transactions 
            (Transaction_ID, User_ID, Date, Type, Main_Group, Sub_Group_1, Sub_Group_2, Sub_Group_3, Sub_Group_4, Sub_Group_5, Description, Amount, Project_ID, Attachment) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const batchList = body.records.map(record => {
            const transId = crypto.randomUUID();
            return stmt.bind(
              transId, userId, record.date, record.type, record.group, 
              record.subGroup1 || null, record.subGroup2 || null, record.subGroup3 || null, record.subGroup4 || null, record.subGroup5 || null, 
              record.description, record.amount, record.projectId || null, record.attachment || null
            );
          });

          await env.DB.batch(batchList);
          return new Response(JSON.stringify({ status: "success", count: batchList.length }), { headers: { "content-type": "application/json", ...corsHeaders } });
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
