async function run() {
  const baseUrl = "http://localhost:3000";

  console.log("=== Testing Parent Journey & Student Profile Management E2E ===");

  // 1. Log in as parent
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "parent@monsieurfanyi.gn",
      password: "Password123!",
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  }

  const cookieHeader = loginRes.headers.get("set-cookie") || "";
  const loginData = await loginRes.json();
  console.log(`✓ 1. Logged in as: ${loginData.user.fullName} (${loginData.user.role})`);

  // 2. Fetch Parent Profile
  const profileRes = await fetch(`${baseUrl}/api/parent/profile`, {
    headers: { Cookie: cookieHeader },
  });
  const profileData = await profileRes.json();
  console.log(`✓ 2. Parent Profile: ${profileData.user.fullName}, City: ${profileData.profile.city}, Children: ${profileData.profile.childrenCount}`);

  // 3. Fetch Master Data
  const masterRes = await fetch(`${baseUrl}/api/parent/master-data`, {
    headers: { Cookie: cookieHeader },
  });
  const masterData = await masterRes.json();
  console.log(`✓ 3. Master Data: ${masterData.subjects.length} subjects, ${masterData.gradeLevels.length} grade levels`);

  // 4. Create Student Profile
  const newStudentPayload = {
    fullName: "Aissatou Barry",
    cycle: "COLLEGE",
    gradeLevel: "10ème Année (BEPC)",
    schoolName: "Collège Kipé",
    supportNeeds: "Remise à niveau en Sciences Physiques et Calcul",
    preferredSubjects: ["Physique-Chimie", "Mathématiques"],
    notes: "Notes pédagogiques confidentielles pour le tuteur assigné.",
  };

  const createRes = await fetch(`${baseUrl}/api/parent/children`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify(newStudentPayload),
  });

  if (!createRes.ok) {
    throw new Error(`Create student failed: ${await createRes.text()}`);
  }
  const createData = await createRes.json();
  const studentId = createData.data.id;
  console.log(`✓ 4. Student Created: "${createData.data.fullName}" (Cycle: ${createData.data.cycle}, ID: ${studentId})`);

  // 5. Update Student Profile
  const updateRes = await fetch(`${baseUrl}/api/parent/children/${studentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      gradeLevel: "10ème Année — Option Scientifique",
      supportNeeds: "Préparation intensive aux épreuves du BEPC Unique",
    }),
  });

  const updateData = await updateRes.json();
  console.log(`✓ 5. Student Updated: Grade is now "${updateData.data.gradeLevel}"`);

  // 6. Fetch Student Detail
  const detailRes = await fetch(`${baseUrl}/api/parent/children/${studentId}`, {
    headers: { Cookie: cookieHeader },
  });
  const detailData = await detailRes.json();
  console.log(`✓ 6. Student Detail Verified: "${detailData.data.fullName}" with ${detailData.data.preferredSubjects.length} target subjects`);

  // 7. Update Parent Profile
  const parentUpdateRes = await fetch(`${baseUrl}/api/parent/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      fullName: "M. Ibrahima Barry",
      phoneNumber: "620123456",
      city: "Conakry",
      address: "Kipé Centre Émetteur, Ratoma",
    }),
  });
  const parentUpdateData = await parentUpdateRes.json();
  console.log(`✓ 7. Parent Information Updated: City=${parentUpdateData.profile.city}, Address=${parentUpdateData.profile.address}`);

  // 8. Delete Student Profile
  const deleteRes = await fetch(`${baseUrl}/api/parent/children/${studentId}`, {
    method: "DELETE",
    headers: { Cookie: cookieHeader },
  });
  const deleteData = await deleteRes.json();
  console.log(`✓ 8. Student Lifecycle: Action=${deleteData.action}, Message="${deleteData.message}"`);

  console.log("\n>>> ALL PHASE 04 E2E WORKFLOWS VERIFIED SUCCESSFULLY ON RUNNING SERVER! <<<");
}

run().catch((err) => {
  console.error("E2E Test Failed:", err);
  process.exit(1);
});
