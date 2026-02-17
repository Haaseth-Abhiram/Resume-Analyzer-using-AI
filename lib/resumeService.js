import { db, storage } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzeResume(file, userId, jobTitle = "", industry = "") {
  try {
    // Validate file size explicitly
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size exceeds 5MB limit");
    }

    // Step 1: Create a FormData object for the API request
    const formData = new FormData();
    formData.append("file", file);
    
    if (jobTitle) formData.append("job_title", jobTitle);
    if (industry) formData.append("industry", industry);
    
    // Step 2: Send the file to your FastAPI backend for analysis
    const response = await fetch(`${API_URL}/analyze-resume`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to analyze resume");
    }
    
    const analysisResult = await response.json();
    
    try {
      // Step 3: Upload the file to Firebase Storage with better error handling
      // Create a more unique filename to avoid collisions
      const safeFileName = file.name.replace(/[^a-zA-Z0-9-.]/g, '_');
      const fileRef = ref(storage, `resumes/${userId}/${Date.now()}_${safeFileName}`);
      
      // Set a timeout for the upload operation (30 seconds instead of 15)
      const uploadPromise = Promise.race([
        uploadBytes(fileRef, file),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Upload timeout - please try again with a smaller file")), 30000)
        )
      ]);
      
      const uploadResult = await uploadPromise;
      console.log("Upload successful:", uploadResult);
      
      const fileUrl = await getDownloadURL(fileRef);
      
      // Step 4: Save the analysis results to Firestore
      const analysisDoc = {
        userId,
        fileName: file.name,
        fileUrl,
        jobTitle: jobTitle || null,
        industry: industry || null,
        score: analysisResult.score,
        analysis: analysisResult.analysis,
        strengths: analysisResult.strengths,
        weaknesses: analysisResult.weaknesses,
        suggestions: analysisResult.suggestions,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, "resumeAnalyses"), analysisDoc);
      
      return {
        id: docRef.id,
        ...analysisResult,
        createdAt: analysisDoc.createdAt
      };
    } catch (storageError) {
      console.error("Firebase storage error:", storageError);
      
      // More detailed error handling
      let errorMessage = "Failed to save resume to storage";
      if (storageError.code) {
        // Firebase specific error codes
        switch (storageError.code) {
          case 'storage/unauthorized':
            errorMessage = "You don't have permission to upload files";
            break;
          case 'storage/canceled':
            errorMessage = "Upload canceled";
            break;
          case 'storage/quota-exceeded':
            errorMessage = "Storage quota exceeded";
            break;
          case 'storage/retry-limit-exceeded':
            errorMessage = "Upload failed after multiple attempts";
            break;
          default:
            errorMessage = `Storage error: ${storageError.message}`;
        }
      }
      
      // Even if storage fails, return the analysis to the user
      return {
        ...analysisResult,
        createdAt: new Date().toISOString(),
        storageError: true,
        storageErrorMessage: errorMessage
      };
    }
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw error;
  }
}

export async function getUserAnalysisHistory(userId) {
  try {
    console.log("Getting history for user ID:", userId);
    
    if (!userId) {
      throw new Error("User ID is required to fetch analysis history");
    }
    
    // Make sure Firestore is initialized
    if (!db) {
      throw new Error("Firestore database is not initialized");
    }
    
    const analysesCollection = collection(db, "resumeAnalyses");
    
    // Only use the where clause without the orderBy
    const q = query(
      analysesCollection,
      where("userId", "==", userId)
    );
    
    console.log("Query created, fetching documents...");
    const querySnapshot = await getDocs(q);
    console.log(`Query executed, found ${querySnapshot.size} documents`);
    
    const analyses = [];
    
    querySnapshot.forEach((doc) => {
      if (doc.exists()) {
        const data = doc.data();
        analyses.push({
          id: doc.id,
          userId: data.userId || userId,
          fileName: data.fileName || "Unknown",
          fileUrl: data.fileUrl || "",
          jobTitle: data.jobTitle || null,
          industry: data.industry || null,
          score: data.score || 0,
          analysis: data.analysis || "",
          strengths: data.strengths || [],
          weaknesses: data.weaknesses || [],
          suggestions: data.suggestions || [],
          createdAt: data.createdAt || new Date().toISOString()
        });
      }
    });
    
    // Sort after fetching (client-side sorting)
    analyses.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    console.log(`Returning ${analyses.length} analysis records`);
    return analyses;
  } catch (error) {
    console.error("Error in getUserAnalysisHistory:", error);
    throw new Error(`Failed to fetch analysis history: ${error.message}`);
  }
}

export async function getAnalysisById(analysisId) {
  try {
    const docRef = doc(db, "resumeAnalyses", analysisId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error("Analysis not found");
    }
  } catch (error) {
    console.error("Error fetching analysis:", error);
    throw error;
  }
}