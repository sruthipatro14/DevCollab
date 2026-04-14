export const applicationStore = {
  applications: [],
  projects: [
    {
      id: 1,
      title: "AI Research Assistant",
      faculty: "Prof. Johnson",
      slots: 3,
      skills: "Python, ML, NLP",
      description: "Build an AI assistant for academic research.",
      type: "faculty",
      createdBy: "faculty",
      ownerName: "Prof. Johnson"
    },
    {
      id: 2,
      title: "Web Dev Platform",
      faculty: "Dr. Smith",
      slots: 2,
      skills: "React, Node.js",
      description: "Develop a collaborative project platform.",
      type: "faculty",
      createdBy: "faculty",
      ownerName: "Dr. Smith"
    },
    {
      id: 3,
      title: "Data Visualization Tool",
      faculty: "Prof. Lee",
      slots: 4,
      skills: "D3.js, Data Science",
      description: "Create interactive dashboards for datasets.",
      type: "faculty",
      createdBy: "faculty",
      ownerName: "Prof. Lee"
    }
  ]
};