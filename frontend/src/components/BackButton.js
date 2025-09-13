import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <Button variant="secondary" onClick={() => navigate(-1)}>
      &larr; Back
    </Button>
  );
};

export default BackButton;
