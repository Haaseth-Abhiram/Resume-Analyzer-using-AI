'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Upload, Award, Zap, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, getUserData } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getUserAnalysisHistory } from "@/lib/resumeService";
import { format, parseISO } from 'date-fns';

export default function Dashboard() {
  const [userName, setUserName] = useState("");
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push('/login');
          return;
        }
  
        // Get user's name
        if (user.displayName) {
          setUserName(user.displayName);
        } else {
          const userData = await getUserData(user.uid);
          if (userData?.fullName) {
            setUserName(userData.fullName);
          }
        }
  
        // Get analysis history
        const history = await getUserAnalysisHistory(user.uid);
        setAnalysisHistory(history);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard data");
        setIsLoading(false);
      }
    };
  
    loadUserData();
  }, [router]);

  // Calculate plan usage
  const planInfo = {
    name: "Free Plan",
    uploadsUsed: analysisHistory.length || 0,
    uploadsTotal: 3,
    features: ["Basic resume analysis", "3 resume uploads per month", "Basic skill matching"]
  };

  // Get latest analysis
  const latestAnalysis = analysisHistory.length > 0 ? analysisHistory[0] : null;

  // Calculate ATS score from latest analysis
  const calculateAtsScore = () => {
    if (!latestAnalysis) return 0;
    return latestAnalysis.score || 0;
  };

  // Calculate skill match from latest analysis
  const calculateSkillMatch = () => {
    if (!latestAnalysis) return 0;
    const totalPoints = (latestAnalysis.strengths?.length || 0) + (latestAnalysis.weaknesses?.length || 0);
    if (totalPoints === 0) return 0;
    const strengthPoints = latestAnalysis.strengths?.length || 0;
    return Math.round((strengthPoints / totalPoints) * 100);
  };

  if (isLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {userName || 'User'}
          </h1>
          <p className="text-muted-foreground">Track your resume optimization progress</p>
        </div>
        <Link href="/dashboard/analyze">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Analyze Resume
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        <Card>
          <CardHeader>
            <CardTitle>Latest Analysis</CardTitle>
            <CardDescription>Resume score and insights</CardDescription>
          </CardHeader>
          <CardContent>
            {latestAnalysis ? (
              <>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary">{latestAnalysis.score}</div>
                  <div className="text-sm text-muted-foreground">Resume Score</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>ATS Optimization</span>
                    <span>{calculateAtsScore()}%</span>
                  </div>
                  <Progress value={calculateAtsScore()} />
                  <div className="flex justify-between text-sm">
                    <span>Skill Match</span>
                    <span>{calculateSkillMatch()}%</span>
                  </div>
                  <Progress value={calculateSkillMatch()} />
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No analysis available yet</p>
                <Link href="/dashboard/analyze" className="text-primary text-sm mt-2 block">
                  Analyze your first resume
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/analyze">
              <Button variant="outline" className="w-full justify-start">
                <Upload className="mr-2 h-4 w-4" />
                Upload New Resume
              </Button>
            </Link>
            
            <Link href="/dashboard/analyze">
              <Button variant="outline" className="w-full justify-start">
                <Zap className="mr-2 h-4 w-4" />
                Compare with Job
              </Button>
            </Link>
            
            {latestAnalysis && (
              <Link href={`/dashboard/progress?analysis=${latestAnalysis.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  View Latest Analysis
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}