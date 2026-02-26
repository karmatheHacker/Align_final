import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../constants/colors';

const NUM_AXES = 5;

const AXES = [
    { key: 'ambition_signal', label: 'AMBITION' },
    { key: 'emotional_depth', label: 'EMOTION' },
    { key: 'visual_confidence', label: 'VISUAL' },
    { key: 'lifestyle_clarity', label: 'LIFESTYLE' },
    { key: 'intent_strength', label: 'INTENT' },
] as const;

const GRID_LEVELS = [0.25, 0.5, 0.75, 1.0];

interface RadarChartProps {
    data?: Record<string, number>;
    size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ data = {}, size = 220 }) => {
    const cx = size / 2;
    const cy = size / 2;
    const RADIUS = size * 0.32;
    const LABEL_RADIUS = size * 0.45;

    const angleFor = (i: number) => (Math.PI * 2 * i) / NUM_AXES - Math.PI / 2;

    const pointAt = (i: number, level: number) => {
        const a = angleFor(i);
        return {
            x: cx + RADIUS * level * Math.cos(a),
            y: cy + RADIUS * level * Math.sin(a),
        };
    };

    const labelAt = (i: number) => {
        const a = angleFor(i);
        return {
            x: cx + LABEL_RADIUS * Math.cos(a),
            y: cy + LABEL_RADIUS * Math.sin(a),
        };
    };

    const polyPath = (level: number) =>
        Array.from({ length: NUM_AXES }, (_, i) => {
            const p = pointAt(i, level);
            return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        }).join(' ') + ' Z';

    // Normalised 0-1 values
    const values = AXES.map(({ key }) => Math.max(0, Math.min(100, data[key] ?? 0)) / 100);

    const dataPath =
        values
            .map((v, i) => {
                const p = pointAt(i, v);
                return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
            })
            .join(' ') + ' Z';

    return (
        <View style={styles.wrapper}>
            <Svg width={size} height={size}>
                {/* Grid polygons */}
                {GRID_LEVELS.map((lvl) => (
                    <Path
                        key={lvl}
                        d={polyPath(lvl)}
                        fill="none"
                        stroke="rgba(0,0,0,0.06)"
                        strokeWidth={0.8}
                    />
                ))}

                {/* Axis spokes */}
                {Array.from({ length: NUM_AXES }, (_, i) => {
                    const end = pointAt(i, 1);
                    return (
                        <Line
                            key={i}
                            x1={cx}
                            y1={cy}
                            x2={end.x}
                            y2={end.y}
                            stroke="rgba(0,0,0,0.06)"
                            strokeWidth={0.8}
                        />
                    );
                })}

                {/* Data area */}
                <Path
                    d={dataPath}
                    fill="rgba(236, 91, 19, 0.05)"
                    stroke={COLORS.primary}
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                />

                {/* Data dots */}
                {values.map((v, i) => {
                    const p = pointAt(i, v);
                    return (
                        <Circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={2.5}
                            fill={COLORS.primary}
                        />
                    );
                })}

                {/* Labels */}
                {AXES.map((axis, i) => {
                    const lp = labelAt(i);
                    return (
                        <SvgText
                            key={axis.key}
                            x={lp.x}
                            y={lp.y}
                            fill={COLORS.gray}
                            fontSize={8}
                            fontWeight="800"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                        >
                            {axis.label}
                        </SvgText>
                    );
                })}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default RadarChart;
