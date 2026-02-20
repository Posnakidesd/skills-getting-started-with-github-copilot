document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <p><strong>Participants:</strong></p>
            <!-- participants list will be inserted here -->
          </div>
        `;

        // Populate participants list (safe DOM creation)
        const participantsContainer = activityCard.querySelector('.participants');
        if (participantsContainer) {
          if (details.participants && details.participants.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'participants-list';
            details.participants.forEach((p) => {
              const li = document.createElement('li');
              li.className = 'participant-item';

              const span = document.createElement('span');
              span.className = 'participant-email';
              span.textContent = p;

              const btn = document.createElement('button');
              btn.className = 'participant-remove';
              btn.setAttribute('aria-label', `Remove ${p} from ${name}`);
              btn.innerHTML = '&times;';

              // Remove participant when clicked
              btn.addEventListener('click', async () => {
                try {
                  const res = await fetch(
                    `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`,
                    { method: 'POST' }
                  );
                  const data = await res.json();
                  if (res.ok) {
                    // Refresh activities list to reflect changes
                    fetchActivities();
                    messageDiv.textContent = data.message;
                    messageDiv.className = 'success';
                  } else {
                    messageDiv.textContent = data.detail || 'Failed to remove participant';
                    messageDiv.className = 'error';
                  }
                } catch (err) {
                  messageDiv.textContent = 'Network error while removing participant';
                  messageDiv.className = 'error';
                  console.error('Error removing participant:', err);
                } finally {
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 4000);
                }
              });

              li.appendChild(span);
              li.appendChild(btn);
              ul.appendChild(li);
            });
            participantsContainer.appendChild(ul);
          } else {
            const empty = document.createElement('p');
            empty.className = 'no-participants';
            empty.textContent = 'No participants yet';
            participantsContainer.appendChild(empty);
          }
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list so UI reflects the new participant immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
