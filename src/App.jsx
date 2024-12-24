import React, { useState, useEffect } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  ScatterChart, 
  Scatter, 
  ResponsiveContainer 
} from 'recharts';

const LatexParser = ({ text }) => {
  // Split text by LaTeX delimiters
  const segments = text.split(/(\$.*?\$)/g);
  
  return (
    <span>
      {segments.map((segment, index) => {
        if (segment.startsWith('$') && segment.endsWith('$')) {
          // Remove the $ delimiters and render as LaTeX
          const latex = segment.slice(1, -1);
          return <InlineMath key={index}>{latex}</InlineMath>;
        }
        // Regular text
        return <span key={index}>{segment}</span>;
      })}
    </span>
  );
};

const TableDisplay = ({ data }) => {
  if (!data || !data.length) return null;

  // Get all unique keys from the data objects
  const headers = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header, colIndex) => (
                <td
                  key={colIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                >
                  {row[header]?.toString() || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const QuestionGraph = ({ graphData, graphType, width = 400, height = 300 }) => {
  if (!graphData) return null;

  const graphs = {
    line: (
      <LineChart width={width} height={height} data={graphData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="y" stroke="#8884d8" />
      </LineChart>
    ),
    bar: (
      <BarChart width={width} height={height} data={graphData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="y" fill="#8884d8" />
      </BarChart>
    ),
    scatter: (
      <ScatterChart width={width} height={height}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" />
        <YAxis dataKey="y" />
        <Tooltip />
        <Legend />
        <Scatter data={graphData} fill="#8884d8" />
      </ScatterChart>
    ),
    table: (
      <TableDisplay data={graphData} />
    )
  };

  return graphs[graphType] || null;
};

const QuizContent = ({ questions, onQuizComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [showResults, setShowResults] = useState(false);  


  useEffect(() => {
    setStartTime(Date.now());
  }, [currentQuestion]);

  const handleAnswer = (optionIndex) => {
    const timeSpent = (Date.now() - startTime) / 1000; // Convert to seconds
    const isCorrect = optionIndex === questions[currentQuestion].correct;
    
    setAnswers([...answers, {
      questionId: questions[currentQuestion].id,
      topic: questions[currentQuestion].topic,
      concept: questions[currentQuestion].concept,
      timeSpent,
      isCorrect,
      userAnswer: optionIndex
    }]);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const downloadResults = () => {
    const headers = ["Question ID", "Topic", "Concept", "Time Spent (s)", "Correct", "User Answer"];
    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(",")].concat(
        answers.map(answer => [
          answer.questionId,
          answer.topic,
          answer.concept,
          answer.timeSpent.toFixed(2),
          answer.isCorrect,
          answer.userAnswer
        ].join(","))
      ).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "quiz_results.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (showResults) {
    const timeData = answers.map((answer, index) => ({
      question: `Q${index + 1}`,
      time: answer.timeSpent
    }));

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
          <div className="mb-6">
            <p className="mb-2">Correct Answers: {answers.filter(a => a.isCorrect).length}/{questions.length}</p>
            <p className="mb-4">Average Time per Question: {
              (answers.reduce((acc, curr) => acc + curr.timeSpent, 0) / answers.length).toFixed(2)
            } seconds</p>
            
            <div className="h-64 w-full mb-6">
              <LineChart width={600} height={200} data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="question" />
                <YAxis label={{ value: 'Time (seconds)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="time" stroke="#8884d8" />
              </LineChart>
            </div>

            <button
              onClick={downloadResults}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Download Results CSV
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Question {currentQuestion + 1}/{questions.length}</h2>
          
          {/* Question text with integrated LaTeX */}
          <div className="mb-2">
            <LatexParser text={question.question} />
          </div>
          
          {/* Add graph if question has graph data */}
          {question.graph && (
            <div className="mb-4">
              <QuestionGraph 
                graphData={question.graph.data}
                graphType={question.graph.type}
              />
            </div>
          )}
        </div>
  
        <div className="grid gap-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className="w-full text-left p-4 border rounded hover:bg-gray-100 transition-colors"
            >
              <LatexParser text={option} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const StartPage = ({ onStartQuiz }) => {
  const [fileError, setFileError] = useState(null);
  const [questionSet, setQuestionSet] = useState(null);
  const [fileContent, setFileContent] = useState(null);

  const validateQuestionSet = (data) => {
    try {
      // Check if it's an array
      if (!Array.isArray(data)) {
        throw new Error('Question set must be an array');
      }
  
      // Check each question's format
      data.forEach((q, idx) => {
        const requiredFields = ['id', 'question', 'options', 'correct', 'topic', 'concept'];
        requiredFields.forEach(field => {
          if (!(field in q)) {
            throw new Error(`Question ${idx + 1} is missing the ${field} field`);
          }
        });
  
        // Validate specific fields
        if (!Array.isArray(q.options)) {
          throw new Error(`Question ${idx + 1} options must be an array`);
        }
        if (q.options.length < 2) {
          throw new Error(`Question ${idx + 1} must have at least 2 options`);
        }
        if (typeof q.correct !== 'number' || q.correct >= q.options.length || q.correct < 0) {
          throw new Error(`Question ${idx + 1} has an invalid correct answer index`);
        }
      });
  
      return true;
    } catch (error) {
      setFileError(error.message);
      return false;
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset states
    setFileError(null);
    setQuestionSet(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target.result);
        setFileContent(content); // Store the raw content

        if (validateQuestionSet(content)) {
          setQuestionSet(content);
        }
      } catch (error) {
        setFileError('Invalid JSON format');
      }
    };
    reader.readAsText(file);
  };

  // Calculate question set statistics
  const getQuestionSetStats = (questions) => {
    if (!questions) return null;

    const topics = [...new Set(questions.map(q => q.topic))];
    const concepts = [...new Set(questions.map(q => q.concept))];
    const topicDistribution = topics.map(topic => ({
      topic,
      count: questions.filter(q => q.topic === topic).length
    }));

    return {
      totalQuestions: questions.length,
      topics,
      concepts,
      topicDistribution
    };
  };

  const stats = getQuestionSetStats(questionSet);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">STEM Quiz Upload</h1>
        
        <div className="mb-6">
          <label className="block mb-2">
            <span className="text-gray-700">Upload Question Set (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>

          {fileError && (
            <div className="mt-2 text-red-600">
              Error: {fileError}
            </div>
          )}
        </div>

        {stats && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Question Set Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Basic Statistics</h3>
                <p>Total Questions: {stats.totalQuestions}</p>
                <p>Number of Topics: {stats.topics.length}</p>
                <p>Number of Concepts: {stats.concepts.length}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Topics Distribution</h3>
                <div className="h-48">
                  <LineChart width={300} height={150} data={stats.topicDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" />
                  </LineChart>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Topics</h3>
                <ul className="list-disc list-inside">
                  {stats.topics.map(topic => (
                    <li key={topic}>{topic}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Concepts</h3>
                <ul className="list-disc list-inside">
                  {stats.concepts.map(concept => (
                    <li key={concept}>{concept}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => onStartQuiz(questionSet)}
              className="mt-6 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Start Quiz
            </button>
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Expected JSON Format:</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
          {`[
  {
    "id": 1,
    "question": "What is the maximum value in the graph?",
    "latex": "f(x) = x^2",
    "options": ["2", "4", "6", "8"],
    "correct": 2,
    "topic": "Functions",
    "concept": "Maximum Values",
    "graph": {
      "type": "line",
      "data": [
        {"x": 0, "y": 0},
        {"x": 1, "y": 1},
        {"x": 2, "y": 4},
        {"x": 3, "y": 6}
      ]
    }
  }
]`}
          </pre>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [questions, setQuestions] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleStartQuiz = (questionSet) => {
    setQuestions(questionSet);
    setShowQuiz(true);
  };

  const handleQuizComplete = (results) => {
    // Handle quiz completion
    setShowQuiz(false);
    setQuestions(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!showQuiz ? (
        <StartPage onStartQuiz={handleStartQuiz} />
      ) : (
        <QuizContent 
          questions={questions} 
          onQuizComplete={handleQuizComplete}
        />
      )}
    </div>
  );
};

export default App;
