/* ── AI ASSISTANT ── */
let lastAssistantText = "";
async function loadChatHistory() {
  const el = document.getElementById("chat-messages");
  if (!selectedFamilyId) {
    el.innerHTML='<div class="state-box state-empty"><p>Select a family member to start chatting.</p></div>';
    return;
  }
  el.innerHTML='<div class="state-box state-loading"><p>Loading conversation…</p></div>';
  try {
    const res = await fetch("/api/assistant/history?family_member_id="+selectedFamilyId);
    if (!res.ok) throw new Error();
    const msgs = await res.json();
    el.innerHTML="";
    if (!msgs.length) el.innerHTML='<div class="state-box state-empty"><p>No conversation yet. Ask a question below.</p></div>';
    else { msgs.forEach(m=>appendChatMsg(m.role,m.content)); scrollChat(); }
  } catch(err) {
    el.innerHTML='<div class="state-box state-empty"><p>Start a new conversation.</p></div>';
  }
}
function appendChatMsg(role,text) {
  const el = document.getElementById("chat-messages");
  const empty = el.querySelector(".state-box");
  if (empty) empty.remove();
  const div = document.createElement("div");
  div.className="chat-msg "+role;
  div.textContent=text;
  el.appendChild(div);
  if (role==="assistant") lastAssistantText=text;
}
function scrollChat() {
  const el=document.getElementById("chat-messages");
  el.scrollTop=el.scrollHeight;
}
async function sendChat() {
  const input=document.getElementById("chat-input");
  const text=input.value.trim();
  if (!text||!selectedFamilyId) return;
  input.value="";
  appendChatMsg("user",text); scrollChat();
  const ph=document.createElement("div");
  ph.className="chat-msg assistant"; ph.textContent="Thinking…"; ph.style.opacity=".5";
  document.getElementById("chat-messages").appendChild(ph); scrollChat();
  try {
    const res=await fetch("/api/assistant/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({family_member_id:selectedFamilyId,message:text})});
    if (!res.ok) throw new Error();
    const data=await res.json();
    ph.remove(); appendChatMsg("assistant",data.response); scrollChat();
  } catch(err) {
    ph.remove(); appendChatMsg("assistant","Sorry, something went wrong. Please try again."); scrollChat();
  }
}
async function speakLast() {
  if (!lastAssistantText) return;
  const btn=document.getElementById("mic-btn");
  btn.textContent="Speaking…"; btn.disabled=true;
  try {
    const res=await fetch("/api/assistant/speak",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:lastAssistantText})});
    if (!res.ok) throw new Error();
    const blob=await res.blob();
    const url=URL.createObjectURL(blob);
    const audio=new Audio(url);
    audio.play();
    audio.onended=()=>{ btn.textContent="Speak"; btn.disabled=false; };
  } catch(err) {
    btn.textContent="Speak"; btn.disabled=false;
    toast("Voice playback failed.","err");
  }
}

async function clearChat() {
  if (!selectedFamilyId) return;
  if (!confirm("Clear this conversation? This cannot be undone.")) return;
  const btn = document.getElementById("clear-chat-btn");
  btn.disabled = true; btn.textContent = "Clearing...";
  try {
    const res = await fetch("/api/assistant/clear?family_member_id=" + selectedFamilyId, { method: "DELETE" });
    if (!res.ok) throw new Error();
    const data = await res.json();
    toast(data.message || "Chat cleared", "ok");
    await loadChatHistory();
    lastAssistantText = "";
  } catch(err) {
    toast("Failed to clear chat", "err");
  } finally {
    btn.disabled = false; btn.textContent = "Clear";
  }
}

async function confirmClearChat() {
  if (!selectedFamilyId) return;
  if (!confirm("Clear this conversation? This cannot be undone.")) return;
  await clearChat();
}
