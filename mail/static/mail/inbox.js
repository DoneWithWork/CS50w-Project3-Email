// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  document.querySelector("#inbox").addEventListener("click", () => load_mailbox("inbox"));
  document.querySelector("#sent").addEventListener("click", () => load_mailbox("sent"));
  document.querySelector("#archived").addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);
  document.querySelector("#compose-form").addEventListener("submit", (e) => {
    e.preventDefault();
    PostEmail();
  });
  load_mailbox("inbox"); // By default, load the inbox
});

// Function Definitions
async function GetInbox(mailbox) {
  const response = await fetch(`/emails/${mailbox}`, {
    method: "GET",
  });
  const emails = await response.json();
  console.log(`${mailbox}:${emails}`);
  return emails;
}

async function PostEmail() {
  const response = await fetch("/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipients: document.querySelector("#compose-recipients").value,
      subject: document.querySelector("#compose-subject").value,
      body: document.querySelector("#compose-body").value,
    }),
  });

  console.log(response);

  const message = await response.json();
  const error = document.querySelector("#error-message");
  error.innerHTML = "";
  if (response.status === 201) {
    console.log("Email sent");
    error.innerHTML = message.message;
    load_mailbox("inbox");
  } else if (response.status === 400) {
    console.log("Error sending email");
    error.innerHTML = message.error;
  }
}

async function ReadSingleEmail(email_id, element, mailbox) {
  const response = await fetch(`/emails/${email_id}`);
  const email = await response.json();
  console.log(email);

  element.style.display = "none";
  const emailElement = document.getElementById("email-view");
  emailElement.innerHTML = "";
  emailElement.style.display = "block";
  const inbox = document.querySelector("#emails-view");
  inbox.style.display = "none";

  const div = document.createElement("div");
  const title = document.createElement("h3");
  title.innerHTML = email.subject;

  const sender = document.createElement("p");
  sender.innerHTML = `From: ${email.sender}`;
  const recipients = document.createElement("p");
  recipients.innerHTML = `To: ${email.recipients}`;
  const body = document.createElement("p");
  body.classList.add("content");
  body.innerHTML = email.body;
  const timestamp = document.createElement("p");
  timestamp.innerHTML = email.timestamp;
  timestamp.classList.add("time");

  div.appendChild(sender);
  div.appendChild(recipients);
  div.appendChild(title);
  div.appendChild(body);
  div.appendChild(timestamp);

  if (mailbox === "inbox") {
    const archive = document.createElement("button");
    archive.innerHTML = "Archive";
    archive.classList.add("email-button");
    archive.addEventListener("click", async () => {
      await fetch(`/emails/${email_id}`, {
        method: "PUT",
        body: JSON.stringify({
          archived: true,
        }),
      });
      load_mailbox("inbox");
    });
    div.appendChild(archive);
  } else if (mailbox === "archive") {
    const unarchive = document.createElement("button");
    unarchive.innerHTML = "Unarchive";
    unarchive.classList.add("email-button");
    unarchive.addEventListener("click", async () => {
      await fetch(`/emails/${email_id}`, {
        method: "PUT",
        body: JSON.stringify({
          archived: false,
        }),
      });
      load_mailbox("inbox");
    });
    div.appendChild(unarchive);
  }

  const reply = document.createElement("button");
  reply.innerHTML = "Reply";
  reply.classList.add("email-button");
  reply.addEventListener("click", () => {
    compose_email();
    document.querySelector("#compose-recipients").value = email.sender;
    document.querySelector("#compose-subject").value = email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`;
    document.querySelector("#compose-body").value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
  });
  div.appendChild(reply);

  emailElement.appendChild(div);

  await fetch(`/emails/${email_id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  });
}

function compose_email() {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.getElementById("email-view").style.display = "none";
  document.querySelector("#error-message").innerHTML = "";
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

async function load_mailbox(mailbox) {
  const inbox = document.querySelector("#emails-view");
  inbox.innerHTML = "";
  inbox.style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.getElementById("email-view").style.display = "none";

  inbox.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  const emails = await GetInbox(mailbox);
  console.log(emails);

  emails.forEach((element) => {
    if (element.archived && mailbox === "inbox") {
      return;
    }
    const div = document.createElement("div");
    div.classList.add("email");

    const sender = document.createElement("span");
    sender.classList.add("title");
    sender.innerHTML = mailbox === "sent" ? "To: " + element.recipients : element.sender.split("@")[0];

    const subject = document.createElement("span");
    subject.classList.add("email-subject");
    subject.innerHTML = element.subject;

    div.style.backgroundColor = element.read ? "lightgrey" : "white";

    div.addEventListener("click", (event) => {
      ReadSingleEmail(element.id, event.currentTarget, mailbox);
    });

    div.appendChild(sender);
    div.appendChild(subject);
    inbox.appendChild(div);
  });
}
