import React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { FormData, Notes, IncomeItem } from "../../types";
import { InfoModal } from "@/components/InfoModal";

interface BudgetAndNotesSectionProps {
  formData: FormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  notes: Notes;
  setNotes: React.Dispatch<React.SetStateAction<Notes>>;
}

export function BudgetAndNotesSection({
  formData,
  handleChange,
  setFormData,
  notes,
  setNotes,
}: BudgetAndNotesSectionProps) {
  // Helpers to calculate totals safely
  const calculateBudgetSourceTotal = () => {
    return (
      Number(formData.budgetSourceExtGov || 0) +
      Number(formData.budgetSourceExtPrivate || 0) +
      Number(formData.budgetSourceExtForeign || 0) +
      Number(formData.budgetSourceInternal || 0)
    ).toFixed(2);
  };

  const calculateIncomeTotal = () => {
    const supportTotal = formData.incomeSupportItems.reduce(
      (sum: number, item: IncomeItem) => sum + Number(item.amount || 0),
      0,
    );
    const registrationTotal = formData.incomeRegistrationItems.reduce(
      (sum: number, item: IncomeItem) => sum + Number(item.amount || 0),
      0,
    );
    const customTotal = (formData.customIncomeCategories || []).reduce(
      (sum: number, cat) =>
        sum +
        cat.items.reduce(
          (itemSum, item) => itemSum + Number(item.amount || 0),
          0,
        ),
      0,
    );
    return (supportTotal + registrationTotal + customTotal).toFixed(2);
  };

  const calculateExpenseTotal = () => {
    return (
      Number(formData.expenseRemuneration || 0) +
      Number(formData.expenseSupplies || 0) +
      Number(formData.expenseMaterials || 0) +
      Number(formData.expenseUtilities || 0) +
      Number(formData.expenseSubsidy || 0) +
      Number(formData.expenseReserve || 0)
    ).toFixed(2);
  };

  // Income Support items handlers
  const addIncomeSupportItem = () => {
    setFormData((prev) => ({
      ...prev,
      incomeSupportItems: [
        ...prev.incomeSupportItems,
        { id: Date.now(), name: "", amount: "" },
      ],
    }));
  };

  const removeIncomeSupportItem = (id: number) => {
    if (formData.incomeSupportItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        incomeSupportItems: prev.incomeSupportItems.filter(
          (item) => item.id !== id,
        ),
      }));
    }
  };

  const updateIncomeSupportItem = (
    id: number,
    field: keyof IncomeItem,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      incomeSupportItems: prev.incomeSupportItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  // Income Registration items handlers
  const addIncomeRegistrationItem = () => {
    setFormData((prev) => ({
      ...prev,
      incomeRegistrationItems: [
        ...prev.incomeRegistrationItems,
        { id: Date.now(), name: "", amount: "" },
      ],
    }));
  };

  const removeIncomeRegistrationItem = (id: number) => {
    if (formData.incomeRegistrationItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        incomeRegistrationItems: prev.incomeRegistrationItems.filter(
          (item) => item.id !== id,
        ),
      }));
    }
  };

  const updateIncomeRegistrationItem = (
    id: number,
    field: keyof IncomeItem,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      incomeRegistrationItems: prev.incomeRegistrationItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  // Custom Income Categories handlers
  const addCustomIncomeCategory = () => {
    setFormData((prev) => ({
      ...prev,
      customIncomeCategories: [
        ...(prev.customIncomeCategories || []),
        {
          id: Date.now(),
          categoryName: "",
          items: [{ id: Date.now() + 1, name: "", amount: "" }],
        },
      ],
    }));
  };

  const removeCustomIncomeCategory = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      customIncomeCategories: (prev.customIncomeCategories || []).filter(
        (cat) => cat.id !== categoryId,
      ),
    }));
  };

  const updateCustomIncomeCategoryName = (
    categoryId: number,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      customIncomeCategories: (prev.customIncomeCategories || []).map((cat) =>
        cat.id === categoryId ? { ...cat, categoryName: value } : cat,
      ),
    }));
  };

  const addCustomIncomeItem = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      customIncomeCategories: (prev.customIncomeCategories || []).map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: [...cat.items, { id: Date.now(), name: "", amount: "" }],
            }
          : cat,
      ),
    }));
  };

  const removeCustomIncomeItem = (categoryId: number, itemId: number) => {
    setFormData((prev) => ({
      ...prev,
      customIncomeCategories: (prev.customIncomeCategories || []).map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter((item) => item.id !== itemId) }
          : cat,
      ),
    }));
  };

  const updateCustomIncomeItem = (
    categoryId: number,
    itemId: number,
    field: keyof IncomeItem,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      customIncomeCategories: (prev.customIncomeCategories || []).map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item,
              ),
            }
          : cat,
      ),
    }));
  };

  return (
    <Card>
      <CardContent className="space-y-6">
        {/* Budget Sources Section */}
        <div>
          <h3 className="font-medium mb-3">แหล่งงบประมาณ</h3>
          <div>
            <table className="w-full">
              <thead className="bg-muted rounded-t-lg">
                <tr>
                  <th className="text-left p-3">รายละเอียด</th>
                  <th className="text-left p-3 w-48">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3">ภายนอกภาครัฐ</td>
                  <td className="p-3">
                    <Input
                      id="budgetSourceExtGov"
                      name="budgetSourceExtGov"
                      type="number"
                      value={formData.budgetSourceExtGov}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3">ภายนอกภาคเอกชน</td>
                  <td className="p-3">
                    <Input
                      id="budgetSourceExtPrivate"
                      name="budgetSourceExtPrivate"
                      type="number"
                      value={formData.budgetSourceExtPrivate}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3">ภายนอกต่างประเทศ</td>
                  <td className="p-3">
                    <Input
                      id="budgetSourceExtForeign"
                      name="budgetSourceExtForeign"
                      type="number"
                      value={formData.budgetSourceExtForeign}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3">รายได้มหาวิทยาลัย</td>
                  <td className="p-3">
                    <Input
                      id="budgetSourceInternal"
                      name="budgetSourceInternal"
                      type="number"
                      value={formData.budgetSourceInternal}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="bg-muted font-medium rounded-b-lg">
                  <td className="p-3">รวมงบประมาณ</td>
                  <td className="p-3">
                    <Input readOnly value={calculateBudgetSourceTotal()} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Income Estimates Section */}
        <div>
          <h3 className="font-medium mb-3">
            ประมาณการรายรับ <span className="text-red-500">*</span>
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">รายละเอียด</th>
                  <th className="text-left p-3 w-48">
                    งบประมาณที่ตั้งไว้ (บาท)
                  </th>
                  <th className="p-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {/* เงินสนับสนุน Section */}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="p-3 font-medium text-gray-700">
                    <div className="flex justify-between items-center">
                      <span>เงินสนับสนุน</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIncomeSupportItem}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        เพิ่มรายการ
                      </Button>
                    </div>
                  </td>
                </tr>
                {formData.incomeSupportItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="p-3 pl-6">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground w-6">
                          {index + 1}.
                        </span>
                        <Input
                          placeholder="ระบุรายละเอียด"
                          value={item.name}
                          onChange={(e) =>
                            updateIncomeSupportItem(
                              item.id,
                              "name",
                              e.target.value,
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.amount}
                        onChange={(e) =>
                          updateIncomeSupportItem(
                            item.id,
                            "amount",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="p-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIncomeSupportItem(item.id)}
                        disabled={formData.incomeSupportItems.length <= 1}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {/* ค่าลงทะเบียน Section */}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="p-3 font-medium text-gray-700">
                    <div className="flex justify-between items-center">
                      <span>ค่าลงทะเบียน</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIncomeRegistrationItem}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        เพิ่มรายการ
                      </Button>
                    </div>
                  </td>
                </tr>
                {formData.incomeRegistrationItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="p-3 pl-6">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground w-6">
                          {index + 1}.
                        </span>
                        <Input
                          placeholder="ระบุรายละเอียด"
                          value={item.name}
                          onChange={(e) =>
                            updateIncomeRegistrationItem(
                              item.id,
                              "name",
                              e.target.value,
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.amount}
                        onChange={(e) =>
                          updateIncomeRegistrationItem(
                            item.id,
                            "amount",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="p-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIncomeRegistrationItem(item.id)}
                        disabled={formData.incomeRegistrationItems.length <= 1}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {/* Custom Income Categories */}
                {formData.customIncomeCategories?.map((category) => (
                  <React.Fragment key={category.id}>
                    <tr className="bg-gray-50 border-t">
                      <td colSpan={3} className="p-3 font-medium text-gray-700">
                        <div className="flex justify-between items-center gap-4">
                          <Input
                            placeholder="ระบุชื่อหัวข้อย่อย"
                            value={category.categoryName}
                            onChange={(e) =>
                              updateCustomIncomeCategoryName(
                                category.id,
                                e.target.value,
                              )
                            }
                            className="max-w-md bg-white border-blue-200 focus-visible:ring-blue-500"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addCustomIncomeItem(category.id)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              เพิ่มรายการ
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeCustomIncomeCategory(category.id)
                              }
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {category.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="p-3 pl-6">
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground w-6">
                              {index + 1}.
                            </span>
                            <Input
                              placeholder="ระบุรายละเอียด"
                              value={item.name}
                              onChange={(e) =>
                                updateCustomIncomeItem(
                                  category.id,
                                  item.id,
                                  "name",
                                  e.target.value,
                                )
                              }
                              className="flex-1"
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.amount}
                            onChange={(e) =>
                              updateCustomIncomeItem(
                                category.id,
                                item.id,
                                "amount",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="p-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeCustomIncomeItem(category.id, item.id)
                            }
                            disabled={category.items.length <= 1}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}

                {/* Button to add custom category */}
                <tr>
                  <td colSpan={3} className="p-3 text-center border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomIncomeCategory}
                      className="w-full border-dashed text-slate-600 hover:bg-slate-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      สร้างหัวข้อย่อยรายรับใหม่
                    </Button>
                  </td>
                </tr>

                <tr className="bg-muted font-medium rounded-b-lg">
                  <td className="p-3">รวมประมาณการรายรับ</td>
                  <td className="p-3">
                    <Input readOnly value={calculateIncomeTotal()} />
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Estimates Section */}
        <div>
          <h3 className="font-medium mb-3">
            ประมาณการรายจ่าย <span className="text-red-500">*</span>
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">รายละเอียด</th>
                  <th className="text-left p-3 w-48">
                    งบประมาณที่ตั้งไว้ (บาท)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3">หมวดค่าตอบแทน</td>
                  <td className="p-3">
                    <Input
                      id="expenseRemuneration"
                      name="expenseRemuneration"
                      type="number"
                      value={formData.expenseRemuneration}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3">หมวดค่าใช้สอย</td>
                  <td className="p-3">
                    <Input
                      id="expenseSupplies"
                      name="expenseSupplies"
                      type="number"
                      value={formData.expenseSupplies}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3">หมวดค่าวัสดุ</td>
                  <td className="p-3">
                    <Input
                      id="expenseMaterials"
                      name="expenseMaterials"
                      type="number"
                      value={formData.expenseMaterials}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3">
                    <span className="flex items-center gap-1">
                      หมวดสาธารณูปโภค
                      <InfoModal
                        title="หมวดสาธารณูปโภค"
                        content="รอเจ้าหน้าที่ส่งให้"
                      />
                    </span>
                  </td>
                  <td className="p-3">
                    <Input
                      id="expenseUtilities"
                      name="expenseUtilities"
                      type="number"
                      value={formData.expenseUtilities}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3">
                    <span className="flex items-center gap-1">
                      หมวดเงินอุดหนุน
                      <InfoModal
                        title="หมวดเงินอุดหนุน"
                        content="รอเจ้าหน้าที่ส่งให้"
                      />
                    </span>
                  </td>
                  <td className="p-3">
                    <Input
                      id="expenseSubsidy"
                      name="expenseSubsidy"
                      type="number"
                      value={formData.expenseSubsidy}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3">
                    <span className="flex items-center gap-1">
                      หมวดเงินสำรอง
                      <InfoModal
                        title="หมวดเงินสำรอง"
                        content="รอเจ้าหน้าที่ส่งให้"
                      />
                    </span>
                  </td>
                  <td className="p-3">
                    <Input
                      id="expenseReserve"
                      name="expenseReserve"
                      type="number"
                      value={formData.expenseReserve}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="bg-muted font-medium rounded-b-lg">
                  <td className="p-3">รวมประมาณการรายจ่าย</td>
                  <td className="p-3">
                    <Input readOnly value={calculateExpenseTotal()} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-4">
          <h3 className="font-medium">หมายเหตุ</h3>
          <div className="flex items-start space-x-3">
            <label htmlFor="note1" className="text-sm leading-relaxed">
              1.ขออนุมัติงบประมาณโครงการที่ไม่เป็นไปตามอัตราการเบิกจ่ายตามข้อบังคับจุฬาลงกรณ์ฯ
              ว่า ด้วยการให้บริการทางวิชาการ พ.ศ. 2564,
              ระเบียบจุฬาลงกรณ์มหาวิทยาลัย ว่าด้วย
              การดำเนินโครงการการให้บริการวิชาการ พ.ศ. 2564
              ประกาศจุฬาลงกรณ์มหาวิทยาลัย เรื่องเกณฑ์และอัตราการเบิกจ่าย
              ในการให้บริการทางวิชาการ พ.ศ. 2564
            </label>
          </div>
          <div className="flex items-start space-x-3">
            <label htmlFor="note4" className="text-sm leading-relaxed">
              2. ขออนุมัติถัวเฉลี่ยทุกรายการ
            </label>
          </div>
          <div className="flex items-start space-x-3">
            <Checkbox
              id="note2"
              checked={notes.note2}
              onCheckedChange={(checked) =>
                setNotes((prev) => ({
                  ...prev,
                  note2: checked as boolean,
                }))
              }
            />
            <label htmlFor="note2" className="text-sm leading-relaxed">
              3. ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการบริหารคณะฯ ดังนี้ (ถ้ามี)
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="note3"
              checked={notes.note3}
              onCheckedChange={(checked) =>
                setNotes((prev) => ({
                  ...prev,
                  note3: checked as boolean,
                }))
              }
            />
            <label htmlFor="note3" className="text-sm leading-relaxed">
              4. ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการการเงิน ดังนี้ (ถ้ามี)
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
