function showToast(id, message) {
  const toastEl = document.getElementById(id);
  toastEl.querySelector(".toast-body").textContent = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

function initSignup() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = Object.fromEntries(new FormData(form));
    console.log("Sending:", formData);

    const result = await Auth.register(formData);
    console.log("Result:", result);

    if (result.success) {
      showToast("toastSuccess", "Compte créé avec succès !");
      document.getElementById("signupModal").classList.remove("show");
      document.body.style.overflow = "";
      window.location.href = "/dashboard.html";
    } else {
      showToast("toastError", result.message);
      if (result.errors) {
        console.log(result.errors);
        showToast("toastError", Auth.formatErrors(result.errors));
      }
    }
  });
}
