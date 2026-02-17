'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getUserAnalysisHistory, getAnalysisById } from "@/lib/resumeService";
import { auth } from "@/lib/firebase";
import { format, parseISO } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, FileText, ChevronRight, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AnalysisItem {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  jobTitle: string | null;
  industry: string | null;
  score: number;
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: any[];
  createdAt: string;
}

interface ChartDataPoint {
  date: string;
  score: number;
}

interface SkillArea {
  skill: string;
  progress: number;
}

export default function ProgressPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysis');
  
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        setIsLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchAnalysisHistory() {
      if (!user) return;

      try {
        setIsLoading(true);
        const history = await getUserAnalysisHistory(user.uid);
        setAnalysisHistory(history);
        setError(null);
        
        if (analysisId) {
          await handleViewAnalysis(analysisId);
        }
      } catch (err: any) {
        console.error("Error fetching analysis history:", err);
        setError(`Failed to load your analysis history. ${err.message || ''}`);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchAnalysisHistory();
    }
  }, [user, analysisId]);

  const progressData: ChartDataPoint[] = analysisHistory
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(item => ({
      date: format(parseISO(item.createdAt), 'MMM yyyy'),
      score: item.score
    }));

  const uniqueMonthsData = progressData.reduce((acc, current) => {
    const existingIndex = acc.findIndex(item => item.date === current.date);
    if (existingIndex >= 0) {
      acc[existingIndex] = current;
    } else {
      acc.push(current);
    }
    return acc;
  }, [] as ChartDataPoint[]);

  const getSkillAreas = (analysis: AnalysisItem | null = null): SkillArea[] => {
    if (!analysis && analysisHistory.length === 0) return [];

    const targetAnalysis = analysis || analysisHistory[0];
    const strengthsLen = targetAnalysis.strengths?.length || 0;
    const weaknessesLen = targetAnalysis.weaknesses?.length || 0;
    const totalLen = strengthsLen + weaknessesLen;
    
    const strengthRatio = totalLen > 0 ? (strengthsLen / totalLen) * 100 : 0;
    const improvementScore = weaknessesLen > 0 ? Math.max(0, 100 - (weaknessesLen / 5) * 100) : 100;
    
    return [
      { skill: 'Content & Quality', progress: targetAnalysis.score },
      { skill: 'Strengths Ratio', progress: Math.round(strengthRatio) },
      { skill: 'Areas to Improve', progress: Math.round(improvementScore) },
    ];
  };

  const currentScore = analysisHistory.length > 0 ? analysisHistory[0].score : 0;
  const lastScore = analysisHistory.length > 1 ? analysisHistory[1].score : 0;
  const improvement = currentScore - lastScore;

  const handleRetry = async () => {
    if (!user) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      const history = await getUserAnalysisHistory(user.uid);
      setAnalysisHistory(history);
    } catch (err) {
      console.error("Retry failed:", err);
      setError("Failed to load your analysis history. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAnalysis = async (analysisId: string) => {
    try {
      setIsLoadingDetail(true);
      const existingAnalysis = analysisHistory.find(item => item.id === analysisId);
      
      if (existingAnalysis) {
        setSelectedAnalysis(existingAnalysis);
      } else {
        const analysis = await getAnalysisById(analysisId);
        setSelectedAnalysis(analysis);
      }
    } catch (err) {
      console.error("Error loading analysis details:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleBackToList = () => {
    setSelectedAnalysis(null);
    setActiveTab("history");
    router.push('/dashboard/progress');
  };

  const calculateAtsScore = (analysis: AnalysisItem | null) => {
    if (!analysis) return 0;
    return Math.round(analysis.score);
  };

  const calculateSkillMatch = (analysis: AnalysisItem | null) => {
    if (!analysis) return 0;
    const totalPoints = (analysis.strengths?.length || 0) + (analysis.weaknesses?.length || 0);
    if (totalPoints === 0) return 0;
    const strengthPoints = analysis.strengths?.length || 0;
    return Math.round((strengthPoints / totalPoints) * 100);
  };

  if (!user && !isLoading) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your progress</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-72 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[350px] w-full" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Progress</AlertTitle>
          <AlertDescription className="mb-4">{error}</AlertDescription>
          <Button 
            variant="outline" 
            onClick={handleRetry}
          >
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  if (analysisHistory.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Progress Tracking</h1>
          <p className="text-muted-foreground">Monitor your resume improvements over time</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No Analysis History</CardTitle>
            <CardDescription>You haven't analyzed any resumes yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Upload and analyze your resume to start tracking your progress.</p>
            <Button onClick={() => router.push('/dashboard/analyze')}>
              Analyze Resume
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingDetail) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Resume Analysis Details</h1>
          <p className="text-muted-foreground">Loading analysis details...</p>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

  if (selectedAnalysis) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <button 
            onClick={handleBackToList}
            className="flex items-center text-sm font-medium text-primary mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to History
          </button>
          <h1 className="text-3xl font-bold">Resume Analysis Details</h1>
          <p className="text-muted-foreground">
            {selectedAnalysis.fileName} | {format(parseISO(selectedAnalysis.createdAt), 'MMM dd, yyyy')}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
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
                    <div className="text-5xl font-bold text-primary">{selectedAnalysis.score}</div>
                    <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>ATS Optimization</span>
                        <span>{calculateAtsScore(selectedAnalysis)}%</span>
                      </div>
                      <Progress value={calculateAtsScore(selectedAnalysis)} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Skill Match</span>
                        <span>{calculateSkillMatch(selectedAnalysis)}%</span>
                      </div>
                      <Progress value={calculateSkillMatch(selectedAnalysis)} />
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
                    {selectedAnalysis.analysis}
                  </p>
                  
                  <div className="flex items-start gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                    <div className="font-medium">Strengths: {selectedAnalysis.strengths?.length || 0}</div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-1" />
                    <div className="font-medium">Areas to Improve: {selectedAnalysis.weaknesses?.length || 0}</div>
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
                  {selectedAnalysis.strengths?.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedAnalysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No strengths identified in this analysis.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weaknesses</CardTitle>
                  <CardDescription>Areas that need improvement</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedAnalysis.weaknesses?.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedAnalysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mt-1" />
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No weaknesses identified in this analysis.</p>
                  )}
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
                {selectedAnalysis.suggestions && selectedAnalysis.suggestions.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {selectedAnalysis.suggestions.map((suggestion, index) => (
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
                            {suggestion.example && (
                              <div className="bg-muted p-3 rounded-md mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Example:</p>
                                <p className="text-sm">{suggestion.example}</p>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-muted-foreground">No suggestions available for this analysis.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Progress Tracking</h1>
        <p className="text-muted-foreground">Monitor your resume improvements over time</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab} value={activeTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Progress</TabsTrigger>
          <TabsTrigger value="history">Analysis History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resume Score Progress</CardTitle>
                <CardDescription>Track your resume score improvements</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {uniqueMonthsData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={uniqueMonthsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-center">
                      {uniqueMonthsData.length === 0 ? 
                        "No resume analysis data available" : 
                        "Upload more resumes to track your progress over time"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Score</CardTitle>
                  <CardDescription>Latest resume analysis result</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-primary">{currentScore}</div>
                    <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                  </div>
                  {improvement !== 0 && (
                    <div className={`text-sm ${improvement > 0 ? 'text-green-600' : 'text-red-600'} text-center`}>
                      {improvement > 0 ? `+${improvement}` : improvement} points from last analysis
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resume Goal</CardTitle>
                  <CardDescription>Progress towards an excellent resume</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Target: 90+</span>
                      <span>Current: {currentScore}</span>
                    </div>
                    <Progress value={currentScore} />
                    <p className="text-sm text-muted-foreground text-center">
                      {currentScore >= 90 
                        ? "Congratulations! You've reached an excellent score." 
                        : `${90 - currentScore} points to reach an excellent resume`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills Breakdown</CardTitle>
              <CardDescription>Detailed progress by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {getSkillAreas().map((item) => (
                  <div key={item.skill}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{item.skill}</span>
                      <span>{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Analysis History</CardTitle>
              <CardDescription>History of your resume improvements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisHistory.map((analysis, index) => (
                  <div 
                    key={analysis.id} 
                    className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0 hover:bg-muted/50 p-2 rounded-md cursor-pointer"
                    onClick={() => {
                      // Update URL with analysis ID for direct linking
                      router.push(`/dashboard/progress?analysis=${analysis.id}`);
                      handleViewAnalysis(analysis.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{analysis.fileName}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(analysis.createdAt), 'MMM dd, yyyy')}
                          {analysis.jobTitle && ` • ${analysis.jobTitle}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{analysis.score}</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}