const button = document.getElementById("sync"),
  status = document.getElementById("status");
button.onclick = async () => {
  button.disabled = true;
  try {
    status.textContent = "Checking Canvas…";
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.url?.startsWith("https://"))
      throw new Error("Open your school Canvas website first.");
    const origin = new URL(tab.url).origin;
    const granted = await chrome.permissions.request({
      origins: [`${origin}/*`],
    });
    if (!granted)
      throw new Error(
        "Acadence needs permission for this Canvas site to import your data.",
      );
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["sync.js"],
    });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => collectCanvasData(),
    });
    if (!result) throw new Error("Canvas did not return any data.");
    status.textContent = "Sending to Acadence…";
    const response = await chrome.runtime.sendMessage({
      type: "UPLOAD_ACADENCE_DATA",
      payload: result,
    });
    if (!response?.ok) throw new Error(response?.error || "Sync failed.");
    status.textContent = `Synced ${response.courseCount} courses, ${response.assignmentCount} assignments, ${response.gradeCount || 0} grades and ${response.announcementCount || 0} announcements.`;
  } catch (error) {
    status.textContent = error.message || "Unable to sync Canvas.";
  } finally {
    button.disabled = false;
  }
};
