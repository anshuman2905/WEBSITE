const farmEl = document.getElementById("farm");
const popup = document.getElementById("popup");
const addLandBtn = document.getElementById("addLandBtn");
const saveLandBtn = document.getElementById("saveLand");

// TODO: Replace with actual login token
const token = localStorage.getItem("token"); 

// Open popup
addLandBtn.onclick = () => {
  popup.style.display = "flex";
};

// Close popup
function closePopup() {
  popup.style.display = "none";
}

// Save land (send to backend)
saveLandBtn.onclick = async () => {
  const crop = document.getElementById("crop").value;
  const area = document.getElementById("area").value;

  if (!crop || !area) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch("/api/lands", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ crop, area })
    });

    const data = await res.json();
    if (res.ok) {
      closePopup();
      renderFarm(data.lands);
    } else {
      alert(data.message || "Failed to save land");
    }
  } catch (err) {
    console.error(err);
    alert("Error saving land");
  }
};

// Render farm layout
function renderFarm(lands) {
  farmEl.innerHTML = "";
  lands.forEach((land, i) => {
    const div = document.createElement("div");
    div.className = "plot";
    div.innerHTML = `<h3>Land ${land.serial}</h3>
                     <p>${land.crop}</p>
                     <small>${land.area} acres</small>`;
    farmEl.appendChild(div);
  });
}

// Fetch lands from backend
async function loadLands() {
  try {
    const res = await fetch("/api/lands", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });
    const data = await res.json();
    if (res.ok) {
      renderFarm(data.lands);
    } else {
      alert(data.message || "Failed to fetch lands");
    }
  } catch (err) {
    console.error(err);
  }
}

// On page load
loadLands();
