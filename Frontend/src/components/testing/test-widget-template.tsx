// Template for creating test widgets - copy and customize for each test category

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle2, XCircle, Clock, Play } from 'lucide-react';

interface TestCase {
  id: string;
  name: string;
  category: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
}

interface TestWidgetProps {
  onStatsUpdate: (stats: { passed: number; failed: number; pending: number }) => void;
}

export function createTestWidget(
  title: string,
  description: string,
  testCases: Omit<TestCase, 'status'>[]
) {
  return function TestWidget({ onStatsUpdate }: TestWidgetProps) {
    const [tests, setTests] = useState<TestCase[]>(
      testCases.map(t => ({ ...t, status: 'pending' as const }))
    );

    const runAllTests = async () => {
      for (let i = 0; i < tests.length; i++) {
        setTests(prev => {
          const newTests = [...prev];
          newTests[i] = { ...newTests[i], status: 'running' };
          return newTests;
        });
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        setTests(prev => {
          const newTests = [...prev];
          // 90% pass rate simulation
          newTests[i] = { ...newTests[i], status: Math.random() > 0.1 ? 'passed' : 'failed' };
          const passed = newTests.filter(t => t.status === 'passed').length;
          const failed = newTests.filter(t => t.status === 'failed').length;
          const pending = newTests.filter(t => t.status === 'pending').length;
          onStatsUpdate({ passed, failed, pending });
          return newTests;
        });
      }
    };

    const categories = Array.from(new Set(tests.map(t => t.category)));

    return (
      <div className="space-y-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
            <Button onClick={runAllTests} className="bg-[#62d5e4] hover:bg-[#52c5d4]">
              <Play className="w-4 h-4 mr-2" />
              Run All Tests
            </Button>
          </div>
        </Card>

        {categories.map(category => (
          <div key={category}>
            <h4 className="text-gray-700 mb-3">{category}</h4>
            <div className="grid gap-2">
              {tests.filter(t => t.category === category).map(test => (
                <Card key={test.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {test.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      {test.status === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                      {test.status === 'running' && <Clock className="w-4 h-4 text-blue-600 animate-spin" />}
                      {test.status === 'pending' && <Clock className="w-4 h-4 text-gray-400" />}
                      <span className="text-sm text-gray-900">{test.name}</span>
                    </div>
                    <Badge variant={test.status === 'passed' ? 'default' : test.status === 'failed' ? 'destructive' : 'outline'}>
                      {test.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };
}
