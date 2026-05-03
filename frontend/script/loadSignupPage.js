document.addEventListener("DOMContentLoaded", async () => {
  try {
    const signupResponse = await fetch("./components/signup/signup.html");
    const signinResponse = await fetch("./components/signin/signin.html");
    
    if (!signupResponse.ok) throw new Error(`Failed to load signup modal: ${signupResponse.status}`);
    if (!signinResponse.ok) throw new Error(`Failed to load signin modal: ${signinResponse.status}`);
    
    const signupHTML = await signupResponse.text();
    const signinHTML = await signinResponse.text();

    document.getElementById("modal-container").innerHTML = signupHTML + signinHTML;
    initSignup();
    initSignin();
   //importannt

    const signupModal = document.getElementById("signupModal");
    const openSignupBtns = document.querySelectorAll(".open-signup-btn");
    const closeSignupBtn = document.getElementById("closeModal");

    if (!signupModal || !openSignupBtns.length || !closeSignupBtn) {
      throw new Error("Required signup modal elements not found");
    }

    openSignupBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        signupModal.classList.add("show");
        document.body.style.overflow = "hidden";
      });
    });

    closeSignupBtn.addEventListener("click", () => {
      signupModal.classList.remove("show");
      document.body.style.overflow = "";
    });

    signupModal.addEventListener("click", (e) => {
      if (e.target === signupModal) {
        signupModal.classList.remove("show");
        document.body.style.overflow = "";
      }
    });

    
    const signinModal = document.getElementById("signinModal");
    const openSigninBtns = document.querySelectorAll(".open-signin-btn");
    const closeSigninBtn = document.getElementById("closeSigninModal");

    if (!signinModal || !openSigninBtns.length || !closeSigninBtn) {
      throw new Error("Required signin modal elements not found");
    }

    openSigninBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        signinModal.classList.add("show");
        document.body.style.overflow = "hidden";
      });
    });

    closeSigninBtn.addEventListener("click", () => {
      signinModal.classList.remove("show");
      document.body.style.overflow = "";
    });

    signinModal.addEventListener("click", (e) => {
      if (e.target === signinModal) {
        signinModal.classList.remove("show");
        document.body.style.overflow = "";
      }
    });


  } catch (error) {
    alert("Error loading modals. Please refresh the page.");
  }
});

function switchToSignin(event) {
  event.preventDefault();
  const signupModal = document.getElementById("signupModal");
  const signinModal = document.getElementById("signinModal");
  
  if (signupModal && signinModal) {
    signupModal.classList.remove("show");
    signinModal.classList.add("show");
  }
}

function switchToSignup(event) {
  event.preventDefault();
  const signupModal = document.getElementById("signupModal");
  const signinModal = document.getElementById("signinModal");
  
  if (signupModal && signinModal) {
    signinModal.classList.remove("show");
    signupModal.classList.add("show");
  }
}
