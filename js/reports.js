/* ── REPORTS PAGE ── */
async function loadReports() {
  if (selectedFamilyId && selectedMemberName) {
    document.getElementById("reports-member-name").textContent = selectedMemberName;
    const member = familyMembersCache.find(m => String(m.id) === selectedFamilyId);
    document.getElementById("reports-member-relation").textContent = member ? member.relation : "";
    try {
      var pRes = await fetch("/api/profiles/" + selectedFamilyId);
      if (pRes.ok) {
        var p = await pRes.json();
        if (p) {
          var infoParts = [];
          if (p.gender) infoParts.push(p.gender);
          if (p.date_of_birth) {
            var b = new Date(p.date_of_birth); var n = new Date();
            var age = n.getFullYear() - b.getFullYear();
            var md = n.getMonth() - b.getMonth();
            if (md < 0 || (md === 0 && n.getDate() < b.getDate())) age--;
            infoParts.push("Age " + age);
          }
          if (p.blood_group) infoParts.push(p.blood_group);
          if (p.location) infoParts.push(p.location);
          document.getElementById("reports-member-relation").textContent =
            (member ? member.relation + " \u00b7 " : "") + infoParts.join(" \u00b7 ");
        }
      }
    } catch(e) {}
  } else {
    document.getElementById("reports-member-name").textContent = "No member selected";
    document.getElementById("reports-member-relation").textContent = "Select a family member from the cards above";
  }
}

async function generateReportPDF() {
  if (!selectedFamilyId) { toast("Select a family member from the cards above first.", "err"); return; }
  const memberName = selectedMemberName;
  const [dRes, cRes, mRes, fRes, eRes, pRes] = await Promise.allSettled([
    fetch("/api/doctors?family_member_id=" + selectedFamilyId),
    fetch("/api/checkups?family_member_id=" + selectedFamilyId),
    fetch("/api/medicines?family_member_id=" + selectedFamilyId),
    fetch("/api/fitness?family_member_id=" + selectedFamilyId),
    fetch("/api/emergency?family_member_id=" + selectedFamilyId),
    fetch("/api/profiles/" + selectedFamilyId),
  ]);
  const doctors = dRes.status === "fulfilled" && dRes.value.ok ? await dRes.value.json() : [];
  const checkups = cRes.status === "fulfilled" && cRes.value.ok ? await cRes.value.json() : [];
  const medicines = mRes.status === "fulfilled" && mRes.value.ok ? await mRes.value.json() : [];
  const fitness = fRes.status === "fulfilled" && fRes.value.ok ? await fRes.value.json() : [];
  const emergency = eRes.status === "fulfilled" && eRes.value.ok ? await eRes.value.json() : null;
  const profile = pRes.status === "fulfilled" && pRes.value.ok ? await pRes.value.json() : null;
  const today = new Date().toISOString().slice(0, 10);
  const recentFitness = fitness.slice(0, 14);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210, margin = 16;
  let y = 0;

  function newPage() {
    doc.addPage();
    doc.setFillColor(26, 46, 31);
    doc.rect(0, 0, pageW, 297, "F");
    y = margin;
  }

  doc.setFillColor(26, 46, 31);
  doc.rect(0, 0, pageW, 297, "F");

  doc.setTextColor(245, 239, 230);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Aegis Health Report", margin, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(143, 174, 139);
  doc.text(memberName, margin, 28);
  var infoY = 34;
  if (profile) {
    var profileParts = [];
    if (profile.gender) profileParts.push(profile.gender);
    if (profile.date_of_birth) {
      var birth = new Date(profile.date_of_birth);
      var now = new Date();
      var age = now.getFullYear() - birth.getFullYear();
      var mDiff = now.getMonth() - birth.getMonth();
      if (mDiff < 0 || (mDiff === 0 && now.getDate() < birth.getDate())) age--;
      profileParts.push("Age " + age);
    }
    if (profile.blood_group) profileParts.push("Blood: " + profile.blood_group);
    if (profile.location) profileParts.push(profile.location);
    if (profileParts.length) {
      doc.setFontSize(9);
      doc.setTextColor(155, 168, 154);
      doc.text(profileParts.join("  |  "), margin, 33);
      infoY = 37;
    }
  }
  doc.setFontSize(9);
  doc.setTextColor(155, 168, 154);
  doc.text("Generated on " + new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), margin, infoY);

  doc.setDrawColor(143, 174, 139);
  doc.setLineWidth(0.4);
  doc.line(margin, infoY + 4, pageW - margin, infoY + 4);
  y = infoY + 10;

  function sectionHeader(title) {
    if (y > 260) newPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(143, 174, 139);
    doc.text(title, margin, y);
    doc.setDrawColor(143, 174, 139);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 2, pageW - margin, y + 2);
    y += 8;
  }

  function tableRow(vals, isHeader) {
    if (y > 275) newPage();
    if (isHeader) {
      doc.setFillColor(30, 52, 36);
      doc.rect(margin, y - 4, pageW - 2 * margin, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
    }
    doc.setTextColor(245, 239, 230);
    let x = margin + 2;
    vals.forEach(v => { doc.text(String(v || "\u2014"), x, y); x += (pageW - 2 * margin - 4) / vals.length; });
    y += 6;
  }

  // Doctors
  if (doctors.length) {
    sectionHeader("Doctors");
    tableRow(["Name", "Specialty", "Clinic", "Phone"], true);
    doctors.forEach(d => tableRow([d.name, d.specialty, d.clinic, d.phone]));
    y += 4;
  }

  // Checkups
  if (checkups.length) {
    sectionHeader("Checkups");
    tableRow(["Date", "Doctor", "Diagnosis", "Follow-up", "Notes"], true);
    checkups.forEach(c => tableRow([c.checkup_date, c.doctors ? c.doctors.name : "\u2014", c.diagnosis, c.follow_up_date, c.notes]));
    y += 4;
  }

  // Medicines
  if (medicines.length) {
    sectionHeader("Medicines");
    tableRow(["Name", "Dosage", "Frequency", "Prescribed by", "Status"], true);
    medicines.forEach(m => {
      const range = [m.start_date, m.end_date].filter(Boolean).join(" \u2013 ") || "";
      const active = !m.end_date || m.end_date >= today;
      tableRow([m.name, m.dosage, m.frequency, m.doctors ? m.doctors.name : "\u2014", active ? "Active" : "Ended"]);
    });
    y += 4;
  }

  // Fitness
  if (recentFitness.length) {
    sectionHeader("Fitness (Last 14 Days)");
    tableRow(["Date", "Steps", "Calories", "Water", "Sleep"], true);
    recentFitness.forEach(f => tableRow([f.log_date, f.steps || 0, (f.calories || 0) + " kcal", (f.water_ml || 0) + " ml", (f.sleep_hours || 0) + " hrs"]));
    y += 4;
  }

  // Emergency
  if (emergency && emergency.blood_group) {
    sectionHeader("Emergency Info");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(245, 239, 230);
    const rows = [
      ["Blood Group", emergency.blood_group],
      ["Allergies", emergency.allergies],
      ["Conditions", emergency.conditions],
      ["Emergency Contact", (emergency.emergency_contact_name || "") + " " + (emergency.emergency_contact_phone || "")],
    ];
    rows.forEach(([k, v]) => {
      if (y > 275) newPage();
      doc.setFont("helvetica", "bold"); doc.text(k + ":", margin, y);
      doc.setFont("helvetica", "normal"); doc.text(String(v || "\u2014"), margin + 50, y);
      y += 6;
    });
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(107, 122, 106);
  doc.text("Aegis Health \u00b7 generated " + new Date().toLocaleDateString("en-IN"), margin, 285);

  doc.save("aegis-report-" + memberName.toLowerCase().replace(/\s+/g, "-") + ".pdf");
}
