/**
 * Card presets — port of `.card-white` and `.card-dark` from src/index.css.
 */
import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "../../lib/cn";

interface CardProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

/** `.card-white`: white bg, hairline border, rounded-lg, p-4. */
export const Card: React.FC<CardProps> = ({ className, children, ...rest }) => (
  <View
    className={cn(
      "bg-white dark:bg-surface-tile-2 border border-black/[0.07] dark:border-hairline-dark rounded-lg p-4",
      className,
    )}
    {...rest}
  >
    {children}
  </View>
);

/** `.card-dark`: surface-tile bg, rounded-lg, p-4. */
export const CardDark: React.FC<CardProps> = ({
  className,
  children,
  ...rest
}) => (
  <View
    className={cn(
      "bg-surface-tile-2 dark:bg-surface-tile-3 rounded-lg p-4",
      className,
    )}
    {...rest}
  >
    {children}
  </View>
);
