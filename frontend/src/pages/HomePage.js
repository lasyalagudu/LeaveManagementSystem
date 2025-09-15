import React from 'react';

const HomePage = () => {
  const cards = [
    { title: 'Apply for Leave', description: 'Submit new leave requests quickly and easily.' },
    { title: 'View Leave Balance', description: 'Check your available leave days at any time.' },
    { title: 'Leave History', description: 'Review past leave requests and their statuses.' },
    { title: 'Employee Directory', description: 'Find details and contact information of employees.' },
    { title: 'Settings', description: 'Manage your profile and notification preferences.' },
  ];

  return (
    <div style={styles.page}>
      <h1 style={styles.header}>Leave Management System</h1>
      <div style={styles.cardContainer}>
        {cards.map((card, idx) => (
          <div key={idx} style={styles.card}>
            <h2 style={styles.cardTitle}>{card.title}</h2>
            <p style={styles.cardDesc}>{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  page: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#f7fafc',
    minHeight: '100vh',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    color: '#2d3748',
    marginBottom: '2rem',
  },
  cardContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '900px',
  },
  card: {
    background: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(160, 174, 192, 0.6)',
    padding: '1.5rem',
    textAlign: 'center',
    cursor: 'default',
    transition: 'box-shadow 0.3s ease',
  },
  cardTitle: {
    color: '#2b6cb0',
    marginTop: 0,
    marginBottom: '0.75rem',
  },
  cardDesc: {
    color: '#4a5568',
    fontSize: '1rem',
    lineHeight: 1.4,
  },
};

export default HomePage;
