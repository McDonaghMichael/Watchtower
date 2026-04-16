import GradientText from "./GradientText";


export default function PageHeader({ header }) {
  return (
    <div>
      <strong>
        <h1 style={{ textTransform: 'uppercase' }}>
          <GradientText
            colors={["#3b3b3bff", "#8b8b8bff", "#2b2b2bff"]}
            animationSpeed={6}
            showBorder={false}
          >
            {header}
          </GradientText>
        </h1>
      </strong>
    </div>
  );
}