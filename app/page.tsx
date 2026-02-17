'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, BarChart3, Lock, Zap, Award, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span className="font-bold text-xl">ResumeAI</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground">
                Features
              </Link>
              <Link href="#about" className="text-muted-foreground hover:text-foreground">
                About
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Optimize Your Resume with AI-Powered Analysis
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Get instant feedback, skill gap analysis, and personalized recommendations to land your dream job.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg">
                  Try For Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Powerful Features for Career Success
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <FileText className="h-12 w-12 mb-4 text-primary" />
                <CardTitle>Smart Resume Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                Upload your resume in any format and get instant insights on structure, content, and optimization opportunities.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 mb-4 text-primary" />
                <CardTitle>Skill Gap Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                Compare your skills against job requirements and get recommendations for improvement.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Award className="h-12 w-12 mb-4 text-primary" />
                <CardTitle>ATS Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                Ensure your resume passes Applicant Tracking Systems with keyword optimization and formatting suggestions.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Trust Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-6 mb-8">
            <Lock className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-semibold">Secure & Private</h3>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your data is encrypted and never stored permanently. We take privacy seriously and comply with global data protection standards.
          </p>
        </div>
      </section>
    </div>
  );
}