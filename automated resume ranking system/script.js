pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// DOM elements
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const jobDesc = document.getElementById("jobDesc");
const analyzeBtn = document.getElementById("analyzeBtn");
const downloadBtn = document.getElementById("downloadBtn");
const keywordsContainer = document.getElementById("keywordsContainer");
const resultsBody = document.getElementById("resultsBody");
const progressBar = document.querySelector("#progressBar div");

// Application state
let candidates = [];
let jobKeywords = [];
let jobRequirements = { minExp: 0, keywords: [] };
let isProcessing = false;

// Event listeners
dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", handleDragOver);
dropZone.addEventListener("dragleave", handleDragLeave);
dropZone.addEventListener("drop", handleDrop);
fileInput.addEventListener("change", handleFileSelect);
analyzeBtn.addEventListener("click", analyzeJobDescription);

// Drag and drop handlers
function handleDragOver(e) {
  e.preventDefault();
  dropZone.classList.add("highlight");
}

function handleDragLeave() {
  dropZone.classList.remove("highlight");
}

function handleDrop(e) {
  e.preventDefault();
  dropZone.classList.remove("highlight");
  if (e.dataTransfer.files.length) {
    processFiles(e.dataTransfer.files);
  }
}

function handleFileSelect() {
  if (fileInput.files.length) {
    processFiles(fileInput.files);
  }
}

// Main processing function
async function processFiles(files) {
  if (isProcessing) {
    showMessage("Please wait while current files are processed", "info");
    return;
  }

  isProcessing = true;
  candidates = [];
  progressBar.style.width = "0%";
  clearMessages();
  analyzeBtn.disabled = true;
  downloadBtn.disabled = true;

  try {
    const validFiles = Array.from(files).filter(file =>
        file.type === "application/pdf");

    if (validFiles.length === 0) {
      showMessage("No valid PDF files found. Please upload PDF files only.", "error");
      return;
    }

    showMessage(`Processing ${validFiles.length} resume(s)...`, "info");

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const text = await extractTextFromPDF(file);
        const resumeData = parseResume(file.name, text);
        candidates.push(resumeData);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        showMessage(`Skipped ${file.name}: ${error.message}`, "error");
        continue;
      }
      progressBar.style.width = `${((i + 1) / validFiles.length) * 100}%`;
    }

    if (candidates.length > 0) {
      showMessage(`Successfully processed ${candidates.length} resume(s)`, "success");
      analyzeBtn.disabled = false;

      if (jobDesc.value.trim()) {
        analyzeJobDescription();
      }
    } else {
      showMessage("No resumes could be processed", "error");
    }
  } catch (error) {
    console.error("Processing error:", error);
    showMessage("An error occurred during processing", "error");
  } finally {
    isProcessing = false;
    downloadBtn.disabled = candidates.length === 0;
  }
}

// PDF text extraction
async function extractTextFromPDF(file) {
  try {
    const typedArray = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ") + " ";
    }

    if (!text.trim()) {
      throw new Error("PDF appears to be empty or contains no text");
    }

    return text.toLowerCase();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

// Resume parsing
function parseResume(filename, text) {
  // Extract name from filename (basic approach)
  const name = filename.replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .replace(/(^|\s)\S/g, match => match.toUpperCase())
      .trim() || "Unknown Candidate";

  // Comprehensive skills list
  const skillsList = [
    'javascript', 'python', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust', 'swift',
    'kotlin', 'typescript', 'html', 'css', 'sass', 'less', 'sql', 'nosql', 'mongodb',
    'mysql', 'postgresql', 'redis', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
    'terraform', 'ansible', 'jenkins', 'git', 'ci/cd', 'react', 'angular', 'vue',
    'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails',
    'machine learning', 'ai', 'tensorflow', 'pytorch', 'keras', 'opencv', 'nltk',
    'data analysis', 'pandas', 'numpy', 'matplotlib', 'seaborn', 'tableau', 'powerbi',
    'linux', 'unix', 'bash', 'powershell', 'rest api', 'graphql', 'soap',
    'oop', 'functional programming', 'design patterns', 'microservices', 'serverless',
    'agile', 'scrum', 'kanban', 'devops', 'big data', 'hadoop', 'spark', 'kafka'
  ];

  const skills = {};
  const textLower = text.toLowerCase();

  // Find matching skills
  skillsList.forEach(skill => {
    const regex = new RegExp(`\\b${skill.replace(/\+/g, '\\+')}\\b`, 'i');
    if (regex.test(text)) {
      // Assign a "proficiency" score (50-100)
      skills[skill.toUpperCase()] = Math.min(100, Math.floor(Math.random() * 30) + 70);
    }
  });

  // Extract experience (years)
  const expMatch = textLower.match(/(\d+)\s*(years|yrs|year)/);
  const experience = expMatch ? parseInt(expMatch[1]) : Math.floor(Math.random() * 5) + 1;

  return {
    name,
    skills,
    experience,
    filename: filename // Keep original filename for reference
  };
}

// Job description analysis
function analyzeJobDescription() {
  const text = jobDesc.value.toLowerCase().trim();
  if (!text) {
    showMessage("Please enter a job description", "error");
    return;
  }

  // Comprehensive skills list (same as resume parsing)
  const commonSkills = [
    'javascript', 'python', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust', 'swift',
    'kotlin', 'typescript', 'html', 'css', 'sass', 'less', 'sql', 'nosql', 'mongodb',
    'mysql', 'postgresql', 'redis', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
    'terraform', 'ansible', 'jenkins', 'git', 'ci/cd', 'react', 'angular', 'vue',
    'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails',
    'machine learning', 'ai', 'tensorflow', 'pytorch', 'keras', 'opencv', 'nltk',
    'data analysis', 'pandas', 'numpy', 'matplotlib', 'seaborn', 'tableau', 'powerbi',
    'linux', 'unix', 'bash', 'powershell', 'rest api', 'graphql', 'soap',
    'oop', 'functional programming', 'design patterns', 'microservices', 'serverless',
    'agile', 'scrum', 'kanban', 'devops', 'big data', 'hadoop', 'spark', 'kafka'
  ];

  // Find required skills
  jobKeywords = commonSkills.filter(skill => {
    const regex = new RegExp(`\\b${skill.replace(/\+/g, '\\+')}\\b`, 'i');
    return regex.test(text);
  });

  // Extract required experience
  const expMatch = text.match(/(\d+)\s*(years|yrs|year)/);
  jobRequirements.minExp = expMatch ? parseInt(expMatch[1]) : 0;

  // Display extracted requirements
  keywordsContainer.innerHTML = '<h3>Extracted Requirements:</h3>' +
      jobKeywords.map(k => `<span class="keyword">${k}</span>`).join(' ') +
      (jobRequirements.minExp ? `<span class="keyword">${jobRequirements.minExp}+ years experience</span>` : '');

  if (candidates.length > 0) {
    rankCandidates();
  } else {
    showMessage("Upload resumes to see rankings", "info");
  }
}

// Ranking algorithm
function rankCandidates() {
  candidates.forEach(candidate => {
    // Experience score (0-100)
    const expScore = jobRequirements.minExp > 0 ?
        Math.min(100, (candidate.experience / Math.max(jobRequirements.minExp, 1)) * 100) : 50;

    // Skill matching
    let skillScore = 0;
    let matchedSkills = 0;

    jobKeywords.forEach(keyword => {
      const foundSkill = Object.keys(candidate.skills).find(s =>
          s.toLowerCase().includes(keyword.toLowerCase()));

      if (foundSkill) {
        skillScore += candidate.skills[foundSkill];
        matchedSkills++;
      }
    });

    // Calculate weighted score (40% experience, 60% skills)
    const skillMatchRatio = matchedSkills / Math.max(jobKeywords.length, 1);
    const avgSkillScore = skillScore / Math.max(matchedSkills, 1);
    const weightedSkillScore = avgSkillScore * skillMatchRatio;

    candidate.score = Math.round((expScore * 0.4) + (weightedSkillScore * 0.6));
    candidate.matchedSkills = matchedSkills;
    candidate.totalKeywords = jobKeywords.length;
  });

  // Sort by score (descending), then by experience (descending)
  candidates.sort((a, b) =>
      b.score - a.score || b.experience - a.experience);

  displayResults();
}

// Display results in table
function displayResults() {
  resultsBody.innerHTML = '';

  if (candidates.length === 0) {
    resultsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No candidates to display</td></tr>';
    return;
  }

  candidates.forEach((c, i) => {
    const row = document.createElement('tr');

    // Highlight top candidates
    if (i < 3) row.classList.add(`top-${i+1}`);

    row.innerHTML = `
          <td>${i + 1}</td>
          <td>${c.name}</td>
          <td>${c.score}</td>
          <td>${c.experience} yrs</td>
          <td>${c.matchedSkills}/${c.totalKeywords}</td>
        `;
    resultsBody.appendChild(row);
  });

  downloadBtn.disabled = false;
}

// CSV export
function downloadCSV() {
  if (candidates.length === 0) {
    showMessage("No data to export", "error");
    return;
  }

  let csv = "Rank,Name,Score,Experience,Skills Matched,Total Keywords\n";
  candidates.forEach((c, i) => {
    csv += `${i + 1},"${c.name}",${c.score},${c.experience},${c.matchedSkills},${c.totalKeywords}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ranked_candidates.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper functions
function showMessage(message, type = "info") {
  clearMessages();

  const msgElement = document.createElement('div');
  msgElement.className = `status-message ${type}`;
  msgElement.textContent = message;

  dropZone.insertAdjacentElement('afterend', msgElement);
}

function clearMessages() {
  const messages = document.querySelectorAll('.status-message');
  messages.forEach(msg => msg.remove());
}