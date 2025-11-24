import { useState, useEffect } from "react";
import { Col, Row, Card } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import DisplayCard from "../../components/metrics/DisplayCard";
import GradientText from "../../components/GradientText";
import PageHeader from "../../components/PageHeader";

function Home() {
  return (
    <div>
      <Container className="mt-4">
        <PageHeader header={"Dashboard"}/>
      </Container>
    </div>
  );
}

export default Home;
