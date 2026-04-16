package machinelearning

import (
	"encoding/json"
	"os"
)

type Scaler struct {
	Mean  []float32
	Scale []float32 // This is std deviation in sklearn
}

func LoadScalers(filename string) (xScaler, yScaler *Scaler, err error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, nil, err
	}

	var scalerData struct {
		XScaler struct {
			Mean  []float64 `json:"mean"`
			Scale []float64 `json:"scale"`
		} `json:"x_scaler"`
		YScaler struct {
			Mean  []float64 `json:"mean"`
			Scale []float64 `json:"scale"`
		} `json:"y_scaler"`
	}

	if err := json.Unmarshal(data, &scalerData); err != nil {
		return nil, nil, err
	}

	// Convert float64 to float32
	convertSlice := func(f64 []float64) []float32 {
		f32 := make([]float32, len(f64))
		for i, v := range f64 {
			f32[i] = float32(v)
		}
		return f32
	}

	xScaler = &Scaler{
		Mean:  convertSlice(scalerData.XScaler.Mean),
		Scale: convertSlice(scalerData.XScaler.Scale),
	}

	yScaler = &Scaler{
		Mean:  convertSlice(scalerData.YScaler.Mean),
		Scale: convertSlice(scalerData.YScaler.Scale),
	}

	return xScaler, yScaler, nil
}

func (s *Scaler) Transform(data []float32) []float32 {
	result := make([]float32, len(data))
	for i := range data {
		if s.Scale[i] == 0 {
			result[i] = 0
		} else {
			result[i] = (data[i] - s.Mean[i]) / s.Scale[i]
		}
	}
	return result
}

func (s *Scaler) InverseTransform(data []float32) []float32 {
	result := make([]float32, len(data))
	for i := range data {
		result[i] = (data[i] * s.Scale[i]) + s.Mean[i]
	}
	return result
}
