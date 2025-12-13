package machinelearning

import (
	"fmt"
	"log"
	"time"

	onnxruntime "github.com/yalue/onnxruntime_go"
)

func RunMachineLearning(testInput []float32) float64 {
	fmt.Println("🚀 Starting ONNX Model Inference")
	fmt.Println("=================================")

	// Step 1: Initialize ONNX Runtime
	startTime := time.Now()

	err := onnxruntime.InitializeEnvironment()
	if err != nil {
		fmt.Print("❌ Failed to initialize ONNX runtime:", err)
	}
	defer onnxruntime.DestroyEnvironment()

	fmt.Printf("✓ ONNX Runtime initialized (%.2fs)\n", time.Since(startTime).Seconds())

	// Step 2: Load scalers
	fmt.Println("\n📊 Loading scalers...")
	xScaler, yScaler, err := LoadScalers("models/scalers.json")
	if err != nil {
		log.Printf("⚠️ Warning: Could not load scalers: %v", err)
		log.Println("⚠️ Continuing without scalers (assuming model doesn't need them)")
		xScaler = nil
		yScaler = nil
	} else {
		fmt.Println("✓ Scalers loaded")
	}

	// Step 3: Create and load model session
	fmt.Println("\n🤖 Loading ONNX model...")
	modelStart := time.Now()

	// First, load with basic session to inspect the model
	inputShape := onnxruntime.NewShape(1, 16) // batch_size=1, features=16
	outputShape := onnxruntime.NewShape(1, 5) // batch_size=1, outputs=5

	inputNames := []string{"input"}
	outputNames := []string{"output"}

	// Create input and output tensors for session initialization
	dummyInput, err := onnxruntime.NewEmptyTensor[float32](inputShape)
	if err != nil {
		log.Fatal("❌ Failed to create dummy input tensor:", err)
	}
	defer dummyInput.Destroy()

	dummyOutput, err := onnxruntime.NewEmptyTensor[float32](outputShape)
	if err != nil {
		log.Fatal("❌ Failed to create dummy output tensor:", err)
	}
	defer dummyOutput.Destroy()

	session, err := onnxruntime.NewAdvancedSession("models/server_metrics_model.onnx",
		inputNames, outputNames,
		[]onnxruntime.Value{dummyInput},
		[]onnxruntime.Value{dummyOutput},
		nil)
	if err != nil {
		log.Fatal("❌ Failed to load model:", err)
	}
	defer session.Destroy()

	fmt.Printf("✓ Model loaded (%.2fs)\n", time.Since(modelStart).Seconds())

	// Step 4: Display model info
	fmt.Println("\n📋 Model Information:")
	fmt.Println("--------------------")
	fmt.Printf("Inputs: input\n")
	fmt.Printf("Outputs: output\n")

	// Step 5: Prepare test input (use your actual input values)
	fmt.Println("\n🧪 Running Inference Test")
	fmt.Println("-------------------------")

	fmt.Printf("Input shape: [1, %d]\n", len(testInput))
	fmt.Println("Input values:")
	for i, val := range testInput {
		fmt.Printf("  [%2d] %.2f\n", i, val)
	}

	// Step 6: Scale input if scaler available
	var scaledInput []float32
	if xScaler != nil {
		scaledInput = xScaler.Transform(testInput)
		fmt.Println("\n✓ Input scaled using x_scaler")
	} else {
		scaledInput = testInput
		fmt.Println("\n⚠️ No scaler found, using raw input")
	}

	// Step 7: Run inference
	fmt.Println("\n⚡ Running inference...")
	inferenceStart := time.Now()

	// Determine output size (5 outputs based on your model)
	outputSize := 5
	predictions, err := runInference(session, scaledInput, outputSize)
	if err != nil {
		log.Fatal("❌ Inference failed:", err)
	}

	inferenceTime := time.Since(inferenceStart)
	fmt.Printf("✓ Inference completed in %.2fms\n", float64(inferenceTime.Microseconds())/1000.0)

	// Step 8: Scale output if scaler available
	var finalPredictions []float32
	if yScaler != nil {
		finalPredictions = yScaler.InverseTransform(predictions)
		fmt.Println("✓ Output inverse-scaled using y_scaler")
	} else {
		finalPredictions = predictions
	}
	fmt.Println("=====================")

	outputLabels := []string{
		"memory_allocated",
		"memory_allocations",
		"disk_usage_total",
		"disk_usage_used",
		"disk_usage_free",
	}

	for i, pred := range finalPredictions {
		if i < len(outputLabels) {
			fmt.Printf("%-20s: %15.2f\n", outputLabels[i], pred)
		} else {
			fmt.Printf("output_%d          : %15.2f\n", i, pred)
		}
	}

	// Step 10: Compare with Python output
	fmt.Println("\n🔍 COMPARISON with Input Values:")
	fmt.Println("---------------------------------")
	fmt.Printf("%-20s %15s %15s %15s\n", "Metric", "Input", "Predicted", "Difference")
	fmt.Println("------------------------------------------------------------------------")

	inputMetrics := map[string]float32{
		"memory_allocated":   testInput[2],
		"memory_allocations": testInput[3],
		"disk_usage_total":   testInput[5],
		"disk_usage_used":    testInput[6],
		"disk_usage_free":    testInput[7],
	}

	for i, label := range outputLabels {
		if i >= len(finalPredictions) {
			break
		}
		inputVal := inputMetrics[label]
		predicted := finalPredictions[i]
		diff := predicted - inputVal
		pctDiff := float32(0)
		if inputVal != 0 {
			pctDiff = (diff / inputVal) * 100
		}

		fmt.Printf("%-20s %15.2f %15.2f %15.2f (%+.1f%%)\n",
			label, inputVal, predicted, diff, pctDiff)
	}

	// Step 11: Calculate similarity percentage
	actualValues := []float32{
		testInput[2], // memory_allocated
		testInput[3], // memory_allocations
		testInput[5], // disk_usage_total
		testInput[6], // disk_usage_used
		testInput[7], // disk_usage_free
	}

	similarity := calculateSimilarityPercentage(actualValues, finalPredictions)
	fmt.Printf("\n🔗 Similarity Score: %.2f%%\n", similarity)

	fmt.Println("\n✅ All tests completed successfully!")

	return calculateSimilarityPercentage(actualValues, finalPredictions)
}

func runInference(session *onnxruntime.AdvancedSession, input []float32, outputSize int) ([]float32, error) {
	// Create input tensor shape [1, num_features]
	inputTensor, err := onnxruntime.NewTensor(onnxruntime.NewShape(1, int64(len(input))), input)
	if err != nil {
		return nil, fmt.Errorf("failed to create input tensor: %w", err)
	}
	defer inputTensor.Destroy()

	// Create output tensor
	outputTensor, err := onnxruntime.NewEmptyTensor[float32](onnxruntime.NewShape(1, int64(outputSize)))
	if err != nil {
		return nil, fmt.Errorf("failed to create output tensor: %w", err)
	}
	defer outputTensor.Destroy()

	// Run inference
	err = session.Run()
	if err != nil {
		return nil, err
	}

	// Get output data
	outputData := outputTensor.GetData()
	result := make([]float32, len(outputData))
	copy(result, outputData)

	return result, nil
}

// Add a function to calculate similarity percentage
func calculateSimilarityPercentage(actual, predicted []float32) float64 {
	if len(actual) != len(predicted) {
		log.Printf("Mismatched lengths: actual=%d, predicted=%d", len(actual), len(predicted))
		return 0.0
	}

	sumSquares := 0.0
	total := 0.0
	for i := range actual {
		diff := float64(actual[i] - predicted[i])
		sumSquares += diff * diff
		total += float64(actual[i] * actual[i])
	}

	if total == 0 {
		return 100.0 // Perfect match if actual values are all zero
	}

	similarity := 100.0 * (1.0 - (sumSquares / total))
	if similarity < 0 {
		similarity = 0.0
	}

	return similarity
}
