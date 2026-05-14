// src/components/AppInput/AppInput.tsx
import React from "react";
import { TextField, type TextFieldProps } from "@mui/material";
import { Controller, type Control } from "react-hook-form";

// ✅ Dùng type thay vì interface
type AppInputProps = {
    name: string;
    control: Control<any>; // hoặc type form của bạn
    label?: string;
    defaultValue?: string;
} & Omit<TextFieldProps, "name" | "defaultValue">;

const AppInput: React.FC<AppInputProps> = ({
    name,
    control,
    label,
    defaultValue = "",
    ...rest
}) => {
    return (
        <Controller
            name={name}
            control={control}
            defaultValue={defaultValue}
            render={({ field, fieldState }) => (
                <TextField
                    {...field}
                    {...rest}
                    label={label}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                />
            )}
        />
    );
};

export default AppInput;