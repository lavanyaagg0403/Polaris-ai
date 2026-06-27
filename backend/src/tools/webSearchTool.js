export const searchWeb = async (queryText) => {
  const q = queryText.toLowerCase();
  
  if (q.includes('microsoft') || q.includes('interview')) {
    return {
      query: queryText,
      results: [
        {
          title: "Microsoft SWE Intern Interview Experience (2025/2026)",
          url: "https://leetcode.com/discuss/interview-experience",
          snippet: "Microsoft technical interviews focus heavily on basic data structures (Arrays, Trees, HashMaps) and communication. Behavioral questions are based on Microsoft's growth mindset culture."
        },
        {
          title: "Cracking the Microsoft Behavioral Interview: STAR Method",
          url: "https://careers.microsoft.com/students",
          snippet: "Prepare examples showcasing collaboration, handling ambiguity, and customer obsession. Structure response with Situation, Task, Action, and Result."
        }
      ]
    };
  }

  if (q.includes('react') || q.includes('hook') || q.includes('interview questions')) {
    return {
      query: queryText,
      results: [
        {
          title: "React Interview Questions & Answers (Modern React 19)",
          url: "https://react.dev/reference/react",
          snippet: "Review state management, side effects (useEffect), React compiler, server components, and performance optimizations like useMemo and useCallback."
        }
      ]
    };
  }

  return {
    query: queryText,
    results: [
      {
        title: `Search results for "${queryText}"`,
        url: "https://google.com/search?q=" + encodeURIComponent(queryText),
        snippet: `Latest online academic guides and technical discussion threads regarding ${queryText}.`
      }
    ]
  };
};
