function go() {
  let url = document.getElementById("urlInput").value;

  if (!url.startsWith("http")) {
    url = "https://" + url;
  }

  document.getElementById("browserFrame").src = url;
}
