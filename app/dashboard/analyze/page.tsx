'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, CheckCircle, AlertCircle, FileText, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { analyzeResume } from "@/lib/resumeService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { auth } from "@/lib/firebase";

const useToast = () => {
  const showToast = ({ 
    title, 
    description, 
    variant = "default" 
  }: { 
    title: string; 
    description: string; 
    variant?: "default" | "destructive" | "success"; 
  }) => {
    console.log(`Toast: ${title} - ${description} (${variant})`);
    alert(`${title}\n${description}`);
  };
  
  return { toast: showToast };
};

export default function Analyze() {
  const [user, setUser] = useState(null);
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to analyze your resume",
        variant: "destructive"
      });
      return;
    }
  
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a resume file to analyze",
        variant: "destructive"
      });
      return;
    }
  
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeResume(file, user.uid, jobTitle, industry);
      setAnalysis(result);
      
      if (result.storageError) {
        toast({
          title: "Analysis complete",
          description: `Analysis successful but there was an issue saving to your history: ${result.storageErrorMessage || "Unknown error"}. The results are still available.`,
          variant: "success"
        });
      } else {
        toast({
          title: "Analysis complete",
          description: "Your resume has been analyzed successfully",
          variant: "success"
        });
      }
    } catch (error) {
      console.error("Error analyzing resume:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze your resume",
        variant: "destructive"
      });
      setIsAnalyzing(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateAtsScore = (analysis) => {
    if (!analysis) return 0;
    return Math.round(analysis.score);
  };

  const calculateSkillMatch = (analysis) => {
    if (!analysis) return 0;
    const totalPoints = analysis.strengths.length + analysis.weaknesses.length;
    const strengthPoints = analysis.strengths.length;
    return Math.round((strengthPoints / totalPoints) * 100);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Resume Analysis</h1>
        <p className="text-muted-foreground">Upload your resume to get detailed insights</p>
      </div>

      {!analysis ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload Resume</CardTitle>
            <CardDescription>
              Supported formats: PDF, DOCX (max 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center w-full mb-6">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="job-title">Job Title (Optional)</Label>
                <Input 
                  id="job-title" 
                  placeholder="e.g. Software Engineer" 
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="industry">Industry (Optional)</Label>
                <Input 
                  id="industry" 
                  placeholder="e.g. Technology" 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
            </div>
            
            {file && (
              <div className="mt-4">
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="strengths">Strengths & Weaknesses</TabsTrigger>
            <TabsTrigger value="improvements">Improvements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Resume Score</CardTitle>
                  <CardDescription>Overall performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-primary">{analysis.score}</div>
                    <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>ATS Optimization</span>
                        <span>{calculateAtsScore(analysis)}%</span>
                      </div>
                      <Progress value={calculateAtsScore(analysis)} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Skill Match</span>
                        <span>{calculateSkillMatch(analysis)}%</span>
                      </div>
                      <Progress value={calculateSkillMatch(analysis)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analysis Summary</CardTitle>
                  <CardDescription>Key insights from your resume</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    {analysis.analysis}
                  </p>
                  
                  <div className="flex items-start gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                    <div className="font-medium">Strengths: {analysis.strengths.length}</div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-1" />
                    <div className="font-medium">Areas to Improve: {analysis.weaknesses.length}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="strengths">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Strengths</CardTitle>
                  <CardDescription>What your resume does well</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weaknesses</CardTitle>
                  <CardDescription>Areas that need improvement</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-1" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="improvements">
            <Card>
              <CardHeader>
                <CardTitle>Suggested Improvements</CardTitle>
                <CardDescription>Actionable steps to enhance your resume</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {analysis.suggestions.map((suggestion, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </div>
                          <span>{suggestion.area}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-8 space-y-2">
                          <p className="text-sm">{suggestion.suggestion}</p>
                          <div className="bg-muted p-3 rounded-md mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Example:</p>
                            <p className="text-sm">{suggestion.example}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}