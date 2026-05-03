function showToast(id, message) {
  const toastEl = document.getElementById(id);
  if (!toastEl) {
    console.error("Toast element not found:", id);
    return;
  }

  const body = toastEl.querySelector(".toast-body");

  body.textContent = Array.isArray(message)
    ? message.join("\n")
    : message;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

function initSignin() {
  const form = document.getElementById("signinForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Logging in...";
    }

    const formData = Object.fromEntries(new FormData(form));

    console.log("Login data:", formData);

    try {
      const result = await Auth.login(formData);

      console.log("Login result:", result);

      // ── SUCCESS ─────────────────────────────
      if (result.success) {
        showToast("toastSuccess", "Connexion réussie !");

        const modal = document.getElementById("signinModal");
        if (modal) {
          modal.classList.remove("show");
          document.body.style.overflow = "";
        }

        setTimeout(() => {
          window.location.href = "/dashboard.html";
        }, 800);

        return;
      }

      // ── ERROR HANDLING ───────────────────────
      let message = result.message || "Login failed";

      // backend validation errors
      if (result.errors && Object.keys(result.errors).length > 0) {
        message = Object.values(result.errors).flat();
      }

      showToast("toastError", message);

    } catch (err) {
      console.error("Login error:", err);
      showToast("toastError", "Network error. Please try again.");

    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Sign In";
      }
    }
  });
}

