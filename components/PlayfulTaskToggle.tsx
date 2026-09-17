import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Check } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const PATH_LENGTH = 420;
const STRIKE_PATH =
  'M 10 16.91 s 79.8 -11.36 98.1 -11.34 c 22.2 0.02 -47.82 14.25 -33.39 22.02 c 12.61 6.77 124.18 -27.98 133.31 -17.28 c 7.52 8.38 -26.8 20.02 4.61 22.05 c 24.55 1.93 113.37 -20.36 113.37 -20.36';

type Props = {
  label: string;
  checked?: boolean;
  onComplete?: () => void;
  onUncheck?: () => void;
  removeAfterCheck?: boolean;
};

// React Native adaptation of Animate UI's community Playful Todolist.
// The original interaction draws a hand-written wavy strike across completed items.
export function PlayfulTaskToggle({
  label,
  checked: controlled = false,
  onComplete,
  onUncheck,
  removeAfterCheck = true,
}: Props) {
  const { colors } = useAppTheme();
  const [visual, setVisual] = useState(controlled);
  const scale = useSharedValue(1);
  const progress = useSharedValue(controlled ? 1 : 0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisual(controlled);
    progress.value = withTiming(controlled ? 1 : 0, {
      duration: controlled ? 700 : 260,
      easing: Easing.inOut(Easing.quad),
    });
  }, [controlled, progress]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const strikeProps = useAnimatedProps(() => ({
    strokeDashoffset: PATH_LENGTH * (1 - progress.value),
  }));

  const toggle = () => {
    if (timer.current) clearTimeout(timer.current);

    scale.value = withSequence(
      withTiming(0.92, { duration: 70 }),
      withTiming(1.08, { duration: 130, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 140 }),
    );

    if (visual) {
      setVisual(false);
      progress.value = withTiming(0, {
        duration: 260,
        easing: Easing.inOut(Easing.quad),
      });
      timer.current = setTimeout(() => onUncheck?.(), 260);
      return;
    }

    setVisual(true);
    progress.value = withTiming(1, {
      duration: 720,
      easing: Easing.inOut(Easing.quad),
    });
    timer.current = setTimeout(
      () => onComplete?.(),
      removeAfterCheck ? 760 : 0,
    );
  };

  return (
    <View style={s.row}>
      <Animated.View style={checkboxStyle}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: visual }}
          accessibilityLabel={`${visual ? 'Uncheck' : 'Mark'} ${label}${visual ? '' : ' complete'}`}
          onPress={toggle}
          style={[
            s.box,
            {
              borderColor: visual ? colors.accent : colors.border,
              backgroundColor: visual ? colors.accent : colors.background,
            },
          ]}
        >
          {visual ? (
            <Check size={17} color="#fff" strokeWidth={3.5} />
          ) : null}
        </Pressable>
      </Animated.View>

      <View style={s.labelWrap}>
        <Text
          numberOfLines={2}
          style={[s.label, { color: visual ? colors.muted : colors.text }]}
        >
          {label}
        </Text>
        <View pointerEvents="none" style={s.strike}>
          <Svg
            width="100%"
            height="32"
            viewBox="0 0 340 32"
            preserveAspectRatio="none"
          >
            <AnimatedPath
              d={STRIKE_PATH}
              vectorEffect="non-scaling-stroke"
              stroke={colors.text}
              strokeWidth={2}
              strokeLinecap="round"
              strokeMiterlimit={10}
              fill="none"
              strokeDasharray={`${PATH_LENGTH} ${PATH_LENGTH}`}
              animatedProps={strikeProps}
            />
          </Svg>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
    minWidth: 0,
  },
  box: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    position: 'relative',
    flexShrink: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  strike: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
});
