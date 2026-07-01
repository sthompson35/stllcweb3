"""Recalculate Excel formulas using Excel COM automation on Windows"""
import sys
import json
import os
import time

def recalc_with_excel(filepath):
    import win32com.client
    import pythoncom

    pythoncom.CoInitialize()

    abs_path = os.path.abspath(filepath)

    xl = win32com.client.Dispatch("Excel.Application")
    xl.Visible = False
    xl.DisplayAlerts = False

    try:
        wb = xl.Workbooks.Open(abs_path)
        xl.CalculateFull()
        time.sleep(2)

        errors = {}
        total_formulas = 0

        error_vals = {'#REF!', '#DIV/0!', '#VALUE!', '#N/A', '#NAME?', '#NUM!', '#NULL!'}

        for sheet in wb.Worksheets:
            used_range = sheet.UsedRange
            if used_range is None:
                continue
            try:
                rows = used_range.Rows.Count
                cols = used_range.Columns.Count
                start_row = used_range.Row
                start_col = used_range.Column

                for r in range(start_row, start_row + rows):
                    for c in range(start_col, start_col + cols):
                        cell = sheet.Cells(r, c)
                        try:
                            formula = cell.Formula
                            if formula and formula.startswith('='):
                                total_formulas += 1
                                val = str(cell.Value) if cell.Value is not None else ''
                                for err in error_vals:
                                    if err in val:
                                        if err not in errors:
                                            errors[err] = {'count': 0, 'locations': []}
                                        errors[err]['count'] += 1
                                        col_letter = chr(64 + c) if c <= 26 else chr(64 + (c-1)//26) + chr(64 + (c-1)%26 + 1)
                                        errors[err]['locations'].append(f"{sheet.Name}!{col_letter}{r}")
                                        break
                        except:
                            pass
            except Exception as e:
                pass

        wb.Save()
        wb.Close()

        result = {
            "status": "errors_found" if errors else "success",
            "total_errors": sum(v['count'] for v in errors.values()),
            "total_formulas": total_formulas,
        }
        if errors:
            result["error_summary"] = errors

        return result

    finally:
        try:
            xl.Quit()
        except:
            pass
        pythoncom.CoUninitialize()

if __name__ == '__main__':
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'Dynasty_Accounting_OS_v1.xlsx'
    result = recalc_with_excel(filepath)
    print(json.dumps(result, indent=2))
